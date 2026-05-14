import { createFileRoute } from "@tanstack/react-router";
import { Welcome } from "#/components/Welcome";
import { LoadingScreen } from "#/components/LoadingScreen";
import { TariffSimulator } from "#/components/TariffSimulator";
import { useDailyConsumption } from "#/services/octopus/graphql/consumption";
import { useViewer } from "#/services/octopus/graphql/viewer";
import { useProductDetail } from "#/services/octopus/rest/product-detail";
import { useCurrentProducts } from "#/services/octopus/rest/products";
import { useStandardUnitRates } from "#/services/octopus/rest/standard-unit-rates";
import { useStandingCharges } from "#/services/octopus/rest/standing-charges";
import { useSettings } from "#/lib/auth";
import { buildTariffCode, simulateTariff } from "#/lib/tariff";

export const Route = createFileRoute("/simulator")({
	component: SimulatorPage,
});

/** Returns ISO strings for the start and end (exclusive) of the last N complete months. */
function lastCompleteMonths(n: number): { startAt: string; endAt: string } {
	const now = new Date();
	const endAt = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
	const startAt = new Date(
		now.getFullYear(),
		now.getMonth() - n,
		1,
	).toISOString();
	return { startAt, endAt };
}

const PERIOD = lastCompleteMonths(6);

function SimulatorPage() {
	const apiKey = useSettings().apiKey;
	const viewer = useViewer();
	const accountNumber =
		viewer.data?.viewer?.accounts?.at(0)?.number ?? undefined;

	const consumption = useDailyConsumption(
		accountNumber,
		PERIOD.startAt,
		PERIOD.endAt,
	);
	const products = useCurrentProducts();

	// Take the first import meter (non-export, first available)
	const meter = consumption.data?.at(0);
	const slots = meter?.consumption ?? [];
	const gspLetter = meter?.gspLetter ?? "_";

	const periodFrom = slots.at(0)?.startAt ?? "";
	const periodTo = slots.at(-1)?.endAt ?? "";

	const currentTariff =
		meter?.tariff.type === "standard" ? meter.tariff : undefined;
	const currentTariffDetail = useProductDetail(currentTariff?.productCode);
	const currentUnitRates = useStandardUnitRates(
		currentTariff?.productCode,
		currentTariff?.tariffCode,
		periodFrom,
		periodTo,
	);
	const currentStandingCharges = useStandingCharges(
		currentTariff?.productCode,
		currentTariff?.tariffCode,
		periodFrom,
		periodTo,
	);

	const flexCode = products.data?.flexible;
	const flexTariffCode =
		flexCode && gspLetter !== "_"
			? buildTariffCode(flexCode, gspLetter)
			: undefined;
	const flexUnitRates = useStandardUnitRates(
		flexCode,
		flexTariffCode,
		periodFrom,
		periodTo,
	);
	const flexStandingCharges = useStandingCharges(
		flexCode,
		flexTariffCode,
		periodFrom,
		periodTo,
	);

	const agileCode = products.data?.agile;
	const agileTariffCode =
		agileCode && gspLetter !== "_"
			? buildTariffCode(agileCode, gspLetter)
			: undefined;
	const agileUnitRates = useStandardUnitRates(
		agileCode,
		agileTariffCode,
		periodFrom,
		periodTo,
	);
	const agileStandingCharges = useStandingCharges(
		agileCode,
		agileTariffCode,
		periodFrom,
		periodTo,
	);

	if (!apiKey) return <Welcome />;

	if (
		(viewer.isEnabled && viewer.isPending) ||
		(consumption.isEnabled && consumption.isPending) ||
		products.isPending ||
		(currentUnitRates.isEnabled && currentUnitRates.isPending) ||
		(currentStandingCharges.isEnabled && currentStandingCharges.isPending) ||
		(flexUnitRates.isEnabled && flexUnitRates.isPending) ||
		(flexStandingCharges.isEnabled && flexStandingCharges.isPending) ||
		(agileUnitRates.isEnabled && agileUnitRates.isPending) ||
		(agileStandingCharges.isEnabled && agileStandingCharges.isPending)
	)
		return <LoadingScreen>Running simulations...</LoadingScreen>;

	if (consumption.isError || products.isError) {
		return (
			<p className="text-sm text-danger mt-5">
				Failed to load data. Check your API key and try again.
			</p>
		);
	}

	if (slots.length === 0) {
		return (
			<p className="text-sm text-muted mt-5">
				No consumption data available. Your meter may not support daily reads
				yet.
			</p>
		);
	}

	const current =
		currentUnitRates.data && currentStandingCharges.data
			? simulateTariff(
					currentTariffDetail.data?.display_name ?? "Current tariff",
					slots,
					currentUnitRates.data,
					currentStandingCharges.data,
				)
			: undefined;
	const flexible =
		flexUnitRates.data && flexStandingCharges.data
			? simulateTariff(
					"Flexible Octopus",
					slots,
					flexUnitRates.data,
					flexStandingCharges.data,
				)
			: undefined;
	const agile =
		agileUnitRates.data && agileStandingCharges.data
			? simulateTariff(
					"Agile Octopus",
					slots,
					agileUnitRates.data,
					agileStandingCharges.data,
				)
			: undefined;

	const months = Array.from(
		new Set(slots.map((s) => s.startAt.slice(0, 7))),
	).sort();

	return (
		<>
			<h1 className="text-4xl font-bold">Tariff simulator</h1>
			<p className="text-muted text-sm">
				What you'd have paid for electricity over the last 6 months on different
				Octopus tariffs.
			</p>
			<TariffSimulator summary={{ current, flexible, agile }} months={months} />
		</>
	);
}
