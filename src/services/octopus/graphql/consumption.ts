import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import request from "graphql-request";
import { graphql } from "#/graphql";
import type { MeterConsumptionQuery } from "#/graphql/graphql";
import { useSettings } from "#/lib/auth";
import { OCTOPUS_QUERY_KEY } from "../_constants";
import { OCTOPUS_GRAPHQL_ENDPOINT } from "./_constants";
import { fetchAuthToken } from "./token";

const STALE_TIME_MS = 30 * 60 * 1000;

const QUERY = graphql(`
  query MeterConsumption(
    $accountNumber: String!
    $startAt: DateTime!
    $timezone: String!
    $after: String
  ) {
    account(accountNumber: $accountNumber) {
      properties {
        electricityMeterPoints {
          mpan
          gspGroupId
          agreements(includeInactive: false) {
            validFrom
            validTo
            tariff {
              __typename
              ... on StandardTariff {
                productCode
                tariffCode
                unitRate
                standingCharge
              }
              ... on HalfHourlyTariff {
                productCode
                tariffCode
                standingCharge
                unitRates {
                  validFrom
                  validTo
                  value
                }
              }
              ... on DayNightTariff {
                productCode
                tariffCode
                standingCharge
              }
            }
          }
          meters(includeInactive: false) {
            serialNumber
            hasAndAllowsHhReadings
            consumption(
              grouping: DAY
              startAt: $startAt
              timezone: $timezone
              first: 100
              after: $after
            ) {
              edges {
                node {
                  startAt
                  endAt
                  value
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }
    }
  }
`);
export type MeterConsumptionResp = MeterConsumptionQuery;

export type DailyConsumptionSlot = {
	startAt: string;
	endAt: string;
	/** kWh as a decimal string from the API */
	value: string;
};

export type MeterTariff =
	| {
			type: "standard";
			productCode: string;
			tariffCode: string;
			unitRate: number;
			standingCharge: number;
	  }
	| {
			type: "half_hourly";
			productCode: string;
			tariffCode: string;
			standingCharge: number;
	  }
	| { type: "other" };

export type MeterData = {
	mpan: string;
	/** GSP group letter e.g. "A" through "P". Extracted from raw gspGroupId. */
	gspLetter: string;
	tariff: MeterTariff;
	hasHhReadings: boolean;
	consumption: DailyConsumptionSlot[];
};

function parseGspLetter(raw: string | undefined): string {
	if (!raw) return "_";
	// gspGroupId may come as "_A" or "A" or a numeric group; extract the letter
	const match = raw.match(/([A-HJ-P])/i);
	return match ? match[1].toUpperCase() : "_";
}

export function useDailyConsumption(
	accountNumber: string | undefined,
	/** ISO datetime string: start of the period (inclusive) */
	startAt: string,
	/** ISO datetime string: end of the period (exclusive, for client-side filtering) */
	endAt: string,
) {
	const client = useQueryClient();
	const apiKey = useSettings().apiKey;
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	return useQuery({
		queryKey: [
			OCTOPUS_QUERY_KEY,
			apiKey,
			"meterConsumption",
			accountNumber,
			startAt,
			endAt,
		],
		queryFn:
			apiKey && accountNumber
				? async (): Promise<MeterData[]> => {
						const token = await fetchAuthToken(client, apiKey);

						const accSlots = new Map<string, DailyConsumptionSlot[]>();
						type EmpMeta = Omit<MeterData, "consumption">;
						const empMeta = new Map<string, EmpMeta>();
						const cursors = new Map<string, string | undefined>();
						const pendingKeys = new Set<string>();

						let after: string | undefined;
						let isFirstPage = true;

						while (isFirstPage || pendingKeys.size > 0) {
							// Use the cursor from the first pending meter (single-meter common case)
							if (!isFirstPage) {
								const firstPending = pendingKeys.values().next().value as
									| string
									| undefined;
								after = firstPending
									? (cursors.get(firstPending) ?? undefined)
									: undefined;
							}

							const data = await request(
								OCTOPUS_GRAPHQL_ENDPOINT,
								QUERY,
								{ accountNumber, startAt, timezone, after },
								{ Authorization: token },
							);

							isFirstPage = false;
							pendingKeys.clear();

							for (const property of data.account?.properties ?? []) {
								for (const emp of property?.electricityMeterPoints ?? []) {
									if (!emp) continue;

									const activeAgreement = emp.agreements?.find(
										(a) =>
											a && (!a.validTo || new Date(a.validTo) > new Date()),
									);

									let tariff: MeterTariff = { type: "other" };
									const t = activeAgreement?.tariff;
									if (
										t?.__typename === "StandardTariff" &&
										t.productCode &&
										t.tariffCode
									) {
										tariff = {
											type: "standard",
											productCode: t.productCode,
											tariffCode: t.tariffCode,
											unitRate: t.unitRate ?? 0,
											standingCharge: t.standingCharge ?? 0,
										};
									} else if (
										t?.__typename === "HalfHourlyTariff" &&
										t.productCode &&
										t.tariffCode
									) {
										tariff = {
											type: "half_hourly",
											productCode: t.productCode,
											tariffCode: t.tariffCode,
											standingCharge: t.standingCharge ?? 0,
										};
									}

									for (const meter of emp.meters ?? []) {
										if (!meter) continue;
										const key = `${emp.mpan}_${meter.serialNumber}`;

										if (!accSlots.has(key)) {
											accSlots.set(key, []);
											empMeta.set(key, {
												mpan: emp.mpan,
												gspLetter: parseGspLetter(emp.gspGroupId ?? undefined),
												tariff,
												hasHhReadings: meter.hasAndAllowsHhReadings ?? false,
											});
										}

										const newSlots = (meter.consumption?.edges ?? [])
											.map((e) => e?.node)
											.filter(
												(n): n is NonNullable<typeof n> =>
													!!n?.startAt && !!n?.endAt && !!n?.value,
											)
											.map((n) => ({
												startAt: n.startAt!,
												endAt: n.endAt!,
												value: n.value!,
											}));

										accSlots.get(key)!.push(...newSlots);

										if (meter.consumption?.pageInfo.hasNextPage) {
											pendingKeys.add(key);
											cursors.set(
												key,
												meter.consumption.pageInfo.endCursor ?? undefined,
											);
										}
									}
								}
							}
						}

						const meters: MeterData[] = [];
						for (const [key, slots] of accSlots) {
							const meta = empMeta.get(key);
							if (!meta) continue;
							const filtered = slots
								.filter((s) => s.startAt >= startAt && s.startAt < endAt)
								.sort((a, b) => a.startAt.localeCompare(b.startAt));
							meters.push({ ...meta, consumption: filtered });
						}

						return meters;
					}
				: skipToken,
		staleTime: STALE_TIME_MS,
	});
}
