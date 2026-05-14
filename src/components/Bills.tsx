import { EmptyState, Link, Table } from "@heroui/react";
import {
	ArrowDownIcon,
	DownloadSimpleIcon,
	FlameIcon,
	HandDepositIcon,
	LightningIcon,
	TrayIcon,
} from "@phosphor-icons/react";
import * as z from "zod";
import type { BillsQuery } from "#/graphql/graphql";
import { formatDate } from "#/lib/time";
import { useBills } from "#/services/octopus/graphql/bills";

export function Bills({
	accountNumber,
}: {
	accountNumber: string | undefined;
}) {
	const bills =
		useBills(accountNumber)
			.data?.account?.bills?.edges.map((a) => a?.node)
			.filter((node) => !!node) ?? [];

	return (
		<Table className="mt-5">
			<Table.ScrollContainer>
				<Table.Content aria-label="Bills">
					<Table.Header>
						<Table.Column>Period</Table.Column>
						<Table.Column>Electricity</Table.Column>
						<Table.Column>Gas</Table.Column>
						<Table.Column>Charges</Table.Column>
						<Table.Column>Payments</Table.Column>
						<Table.Column>Closing balance</Table.Column>
						<Table.Column>Actions</Table.Column>
					</Table.Header>
					<Table.Body
						renderEmptyState={() => (
							<EmptyState className="flex w-full flex-col items-center justify-center gap-3 text-center h-50">
								<TrayIcon size={24} />
								<span className="text-sm text-muted">No results found</span>
							</EmptyState>
						)}
					>
						{bills.map((bill) => {
							const data = getDataFromBill(bill);
							if (!data) return undefined;
							return (
								<Table.Row key={data.id}>
									<Table.Cell className="text-nowrap">
										<time dateTime={data.fromDate}>
											{formatDate(data.fromDate)}
										</time>{" "}
										to{" "}
										<time dateTime={data.toDate}>
											{formatDate(data.toDate)}
										</time>
									</Table.Cell>
									<Table.Cell>
										<div className="flex items-center gap-1 text-nowrap">
											<LightningIcon size={16} weight="duotone" />
											<span>
												£{(data.charges.electricity / 100).toFixed(2)}
											</span>{" "}
											<span className="text-muted">
												({data.consumption.electricity.toFixed(2)} kWh)
											</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<div className="flex items-center gap-1 text-nowrap">
											<FlameIcon size={16} weight="duotone" />
											<span>£{(data.charges.gas / 100).toFixed(2)} </span>
											<span className="text-muted ">
												({data.consumption.gas.toFixed(2)} kWh)
											</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<div className="flex items-center gap-1 text-nowrap">
											<ArrowDownIcon size={16} className="text-(--danger)" /> £
											{(data.charges.total / 100).toFixed(2)}
										</div>
									</Table.Cell>
									<Table.Cell>
										<div className="flex items-center gap-1">
											<HandDepositIcon size={16} className="text-(--success)" />{" "}
											£{(data.payment / 100).toFixed(2)}
										</div>
									</Table.Cell>
									<Table.Cell>
										<div className="flex items-center gap-1">
											£{(data.closingBalance / 100).toFixed(2)}
										</div>
									</Table.Cell>
									<Table.Cell>
										<Link
											href={data.temporaryUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											<DownloadSimpleIcon size={20} weight="bold" />
										</Link>
									</Table.Cell>
								</Table.Row>
							);
						})}
					</Table.Body>
				</Table.Content>
			</Table.ScrollContainer>
		</Table>
	);
}

function getDataFromBill(
	bill: NonNullable<
		NonNullable<NonNullable<BillsQuery["account"]>["bills"]>["edges"][number]
	>["node"],
):
	| {
			id: string;
			fromDate: string;
			toDate: string;
			payment: number;
			charges: { total: number; electricity: number; gas: number };
			consumption: { electricity: number; gas: number };
			closingBalance: number;
			temporaryUrl: string;
	  }
	| undefined {
	if (bill?.__typename !== "StatementType") return undefined;
	const id = z.string().parse(bill.id);
	const fromDate = z.iso.date().parse(bill?.fromDate);
	const toDate = z.iso.date().parse(bill?.toDate);
	const payment = z
		.number()
		.int()
		.parse(
			bill.transactions?.edges
				.filter((t) => t?.node?.__typename === "Payment")
				.reduce((acc, curr) => acc + (curr?.node?.amounts?.gross ?? 0), 0),
		);
	const electricityCharges = z
		.number()
		.int()
		.parse(
			bill.transactions?.edges
				.filter(
					(t) =>
						t?.node?.__typename === "Charge" &&
						t?.node?.title === "Electricity",
				)
				.reduce((acc, curr) => acc + (curr?.node?.amounts?.gross ?? 0), 0),
		);
	const gasCharges = z
		.number()
		.int()
		.parse(
			bill.transactions?.edges
				.filter(
					(t) => t?.node?.__typename === "Charge" && t?.node?.title === "Gas",
				)
				.reduce((acc, curr) => acc + (curr?.node?.amounts?.gross ?? 0), 0),
		);
	const totalCharges = z
		.number()
		.int()
		.parse(
			bill.transactions?.edges
				.filter((t) => t?.node?.__typename === "Charge")
				.reduce((acc, curr) => acc + (curr?.node?.amounts?.gross ?? 0), 0),
		);
	const electricityConsumption =
		bill.transactions?.edges.reduce(
			(acc, curr) =>
				acc +
				(curr?.node?.__typename === "Charge" &&
				curr.node.title === "Electricity"
					? z.coerce.number().parse(curr?.node.consumption?.quantity ?? 0)
					: 0),
			0,
		) ?? 0;
	const gasConsumption =
		bill.transactions?.edges.reduce(
			(acc, curr) =>
				acc +
				(curr?.node?.__typename === "Charge" && curr.node.title === "Gas"
					? z.coerce.number().parse(curr?.node.consumption?.quantity ?? 0)
					: 0),
			0,
		) ?? 0;
	const closingBalance = z.number().int().parse(bill.closingBalance);
	const temporaryUrl = z
		.httpUrl()
		.parse(bill.attachments?.edges.at(0)?.node?.temporaryUrl);

	return {
		id,
		fromDate,
		toDate,
		payment,
		charges: {
			total: totalCharges,
			electricity: electricityCharges,
			gas: gasCharges,
		},
		consumption: {
			electricity: electricityConsumption,
			gas: gasConsumption,
		},
		closingBalance,
		temporaryUrl,
	};
}
