import type { DailyConsumptionSlot } from "#/services/octopus/graphql/consumption";
import type { UnitRateResp } from "#/services/octopus/rest/_constants";

export type TariffResult = {
	label: string;
	totalPence: number;
	/** Cost broken down by month (YYYY-MM → pence) */
	byMonth: Record<string, number>;
	isEstimate: boolean;
};

export type SimulationSummary = {
	current: TariffResult | undefined;
	flexible: TariffResult | undefined;
	agile: TariffResult | undefined;
};

function monthKey(isoDate: string): string {
	return isoDate.slice(0, 7);
}

function rateAt(rates: UnitRateResp[], isoDate: string): number | undefined {
	const ts = new Date(isoDate).getTime();
	for (const r of rates) {
		const from = r.valid_from ? new Date(r.valid_from).getTime() : -Infinity;
		const to = r.valid_to ? new Date(r.valid_to).getTime() : Infinity;
		if (ts >= from && ts < to) return r.value_inc_vat;
	}
	return undefined;
}

export function simulateTariff(
	label: string,
	slots: DailyConsumptionSlot[],
	unitRates: UnitRateResp[],
	standingCharges: UnitRateResp[],
): TariffResult {
	const byMonth: Record<string, number> = {};
	let totalPence = 0;
	let missingRates = 0;

	for (const slot of slots) {
		const kwh = parseFloat(slot.value);
		if (Number.isNaN(kwh)) continue;

		const key = monthKey(slot.startAt);
		const sc = rateAt(standingCharges, slot.startAt) ?? 0;

		const unitRate = rateAt(unitRates, slot.startAt);
		if (unitRate === undefined) {
			missingRates++;
			// Still account for standing charge even when unit rate is missing
			totalPence += sc;
			byMonth[key] = (byMonth[key] ?? 0) + sc;
			continue;
		}

		const slotCost = kwh * unitRate + sc;
		totalPence += slotCost;
		byMonth[key] = (byMonth[key] ?? 0) + slotCost;
	}

	return {
		label,
		totalPence,
		byMonth,
		isEstimate: missingRates > 0,
	};
}

export function buildTariffCode(
	productCode: string,
	gspLetter: string,
): string {
	return `E-1R-${productCode}-${gspLetter}`;
}
