import { Card } from "@heroui/react";
import { InfoIcon } from "@phosphor-icons/react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { SimulationSummary, TariffResult } from "#/lib/tariff";

type Props = {
	summary: SimulationSummary;
	months: string[];
};

const COLOURS = {
	current: "var(--muted)",
	flexible: "var(--accent)",
	agile: "var(--success)",
};

function poundsLabel(pence: number) {
	return `£${(pence / 100).toFixed(2)}`;
}

function savingLabel(
	result: TariffResult,
	current: TariffResult | undefined,
): string {
	if (!current || result.label === current.label) return "";
	const diff = result.totalPence - current.totalPence;
	if (Math.abs(diff) < 50) return "about the same";
	return diff < 0
		? `save ${poundsLabel(Math.abs(diff))}`
		: `extra ${poundsLabel(diff)}`;
}

function SummaryCard({
	result,
	current,
	accent,
}: {
	result: TariffResult;
	current: TariffResult | undefined;
	accent: string;
}) {
	const saving = savingLabel(result, current);
	const isCheaper = current && result.totalPence < current.totalPence - 50;
	const isDearer = current && result.totalPence > current.totalPence + 50;

	return (
		<Card className="min-w-48">
			<Card.Header>
				<div className="flex items-center gap-2">
					<span
						className="inline-block size-3 rounded-full"
						style={{ background: accent }}
					/>
					<Card.Title className="text-sm font-normal">
						{result.label}
					</Card.Title>
					{result.isEstimate && (
						<span
							className="text-xs text-muted"
							title="Some rate data was unavailable for part of this period"
						>
							<InfoIcon size={12} />
						</span>
					)}
				</div>
			</Card.Header>
			<Card.Content>
				<span className="text-2xl font-bold tabular-nums">
					{poundsLabel(result.totalPence)}
				</span>
			</Card.Content>
			{saving && (
				<Card.Footer>
					<span
						className={`text-xs font-medium ${isCheaper ? "text-success" : isDearer ? "text-danger" : "text-muted"}`}
					>
						{saving} vs current
					</span>
				</Card.Footer>
			)}
		</Card>
	);
}

function buildChartData(summary: SimulationSummary, months: string[]) {
	return months.map((m) => ({
		month: new Date(m).toLocaleString("default", { month: "short" }),
		current: summary.current
			? Math.round(summary.current.byMonth[m] ?? 0) / 100
			: undefined,
		flexible: summary.flexible
			? Math.round(summary.flexible.byMonth[m] ?? 0) / 100
			: undefined,
		agile: summary.agile
			? Math.round(summary.agile.byMonth[m] ?? 0) / 100
			: undefined,
	}));
}

export function TariffSimulator({ summary, months }: Props) {
	const chartData = buildChartData(summary, months);

	return (
		<div className="mt-5 flex flex-col gap-6">
			<div className="flex flex-wrap gap-3">
				{summary.current && (
					<SummaryCard
						result={summary.current}
						current={summary.current}
						accent={COLOURS.current}
					/>
				)}
				{summary.flexible && (
					<SummaryCard
						result={summary.flexible}
						current={summary.current}
						accent={COLOURS.flexible}
					/>
				)}
				{summary.agile && (
					<SummaryCard
						result={summary.agile}
						current={summary.current}
						accent={COLOURS.agile}
					/>
				)}
			</div>

			{months.length > 1 && (
				<Card>
					<Card.Header>
						<Card.Title className="text-sm font-normal text-muted">
							Monthly cost (£)
						</Card.Title>
					</Card.Header>
					<Card.Content>
						<ResponsiveContainer width="100%" height={280}>
							<BarChart
								data={chartData}
								margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="var(--separator)"
								/>
								<XAxis
									dataKey="month"
									tick={{ fontSize: 12, fill: "var(--muted)" }}
								/>
								<YAxis
									tickFormatter={(v) => `£${v}`}
									tick={{ fontSize: 12, fill: "var(--muted)" }}
									width={52}
								/>
								<Tooltip
									formatter={(value) => `£${(value as number).toFixed(2)}`}
									cursor={{ fill: "var(--separator)" }}
									contentStyle={{
										background: "var(--surface)",
										border: "1px solid var(--separator)",
										borderRadius: 8,
										fontSize: 12,
										color: "var(--surface-foreground)",
									}}
								/>
								<Legend
									wrapperStyle={{ fontSize: 12 }}
									content={() => (
										<ul
											style={{
												display: "flex",
												gap: 16,
												justifyContent: "center",
												listStyle: "none",
												padding: 0,
												margin: 0,
												fontSize: 12,
											}}
										>
											{[
												summary.current && {
													label: "Current",
													colour: COLOURS.current,
												},
												summary.flexible && {
													label: "Flexible",
													colour: COLOURS.flexible,
												},
												summary.agile && {
													label: "Agile",
													colour: COLOURS.agile,
												},
											]
												.filter((item) => !!item)
												.map((item) => (
													<li
														key={item.label}
														style={{
															display: "flex",
															alignItems: "center",
															gap: 4,
														}}
													>
														<span
															style={{
																display: "inline-block",
																width: 10,
																height: 10,
																background: item.colour,
																borderRadius: 2,
															}}
														/>
														{item.label}
													</li>
												))}
										</ul>
									)}
								/>
								{summary.current && (
									<Bar
										dataKey="current"
										name="Current"
										fill={COLOURS.current}
										radius={[3, 3, 0, 0]}
									/>
								)}
								{summary.flexible && (
									<Bar
										dataKey="flexible"
										name="Flexible"
										fill={COLOURS.flexible}
										radius={[3, 3, 0, 0]}
									/>
								)}
								{summary.agile && (
									<Bar
										dataKey="agile"
										name="Agile"
										fill={COLOURS.agile}
										radius={[3, 3, 0, 0]}
									/>
								)}
							</BarChart>
						</ResponsiveContainer>
					</Card.Content>
				</Card>
			)}

			<p className="text-xs text-muted">
				Based on your last 6 complete months of daily consumption. Costs include
				standing charges and VAT.
				{summary.agile?.isEstimate &&
					" Agile figures are estimates where rate data was unavailable."}
			</p>
		</div>
	);
}
