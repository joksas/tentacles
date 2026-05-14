import { createFileRoute } from "@tanstack/react-router";
import { Bills } from "#/components/Bills";
import { LoadingScreen } from "#/components/LoadingScreen";
import { Welcome } from "#/components/Welcome";
import { useSettings } from "#/lib/auth";
import { useAccount } from "#/services/octopus/graphql/account";
import { useBills } from "#/services/octopus/graphql/bills";
import { useViewer } from "#/services/octopus/graphql/viewer";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const apiKey = useSettings().apiKey;

	const viewer = useViewer();
	const accountNumber =
		viewer.data?.viewer?.accounts?.at(0)?.number ?? undefined;

	const account = useAccount(accountNumber);
	const billingName = account.data?.account?.billingName;
	const firstName = billingName?.split(" ").at(0);
	const displayName =
		firstName && firstName.length >= 4 ? firstName : billingName;

	const bills = useBills(accountNumber);

	if (!apiKey) return <Welcome />;

	if (
		(viewer.isEnabled && viewer.isPending) ||
		(account.isEnabled && account.isPending) ||
		(bills.isEnabled && bills.isPending)
	)
		return <LoadingScreen>Loading your data...</LoadingScreen>;

	return (
		<>
			<h1 className="text-4xl font-bold">
				Hi{displayName && `, ${displayName}`}!
			</h1>
			<Bills accountNumber={accountNumber} />
		</>
	);
}
