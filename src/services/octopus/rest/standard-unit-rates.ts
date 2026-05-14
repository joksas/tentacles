import { skipToken, useQuery } from "@tanstack/react-query";
import { OCTOPUS_QUERY_KEY } from "../_constants";
import {
	fetchAllPages,
	OCTOPUS_REST_ENDPOINT,
	type UnitRateResp,
} from "./_constants";

const STALE_TIME_MS = 4 * 60 * 60 * 1000;

export function useStandardUnitRates(
	productCode: string | undefined,
	tariffCode: string | undefined,
	periodFrom: string,
	periodTo: string,
) {
	return useQuery({
		queryKey: [
			OCTOPUS_QUERY_KEY,
			"public",
			"standard-unit-rates",
			productCode,
			tariffCode,
			periodFrom,
			periodTo,
		],
		queryFn:
			productCode && tariffCode
				? async (): Promise<UnitRateResp[]> => {
						const base = `${OCTOPUS_REST_ENDPOINT}/products/${productCode}/electricity-tariffs/${tariffCode}`;
						const range = `period_from=${encodeURIComponent(periodFrom)}&period_to=${encodeURIComponent(periodTo)}`;
						return fetchAllPages(
							`${base}/standard-unit-rates/?${range}&page_size=1500`,
						);
					}
				: skipToken,
		staleTime: STALE_TIME_MS,
	});
}
