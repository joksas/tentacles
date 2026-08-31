import { claimOffer } from "#/services/octopus/graphql/claim-offer";
import {
	fetchActiveScratchcard,
	prizeSlug,
	scratchScratchcard,
} from "#/services/octopus/graphql/scratchcard";
import { fetchFreshAuthToken } from "#/services/octopus/graphql/token";
import { fetchActiveAccountNumber } from "#/services/octopus/graphql/viewer";

export default {
	async scheduled(_event: unknown, env: Env, _ctx: unknown): Promise<void> {
		// Auth
		const token = await fetchFreshAuthToken(env.OCTOPUS_API_KEY);
		const accountNumber = await fetchActiveAccountNumber(token);

		// Active scratchcard
		const active = await fetchActiveScratchcard(accountNumber, token);
		const data = active.octoplusActiveScratchcardData;
		let card = data?.scratchcard ?? null;

		if (!card) {
			const session = data?.activeSession;
			if (!session?.externalReference) {
				console.log("No active scratchcard session");
				return;
			}
			const scratched = await scratchScratchcard(
				accountNumber,
				token,
				session.externalReference,
			);
			card = scratched.scratchOctoplusScratchcard?.scratchcard ?? null;
		}

		if (card?.status === "DID_NOT_WIN") {
			console.log("Scratchcard did not win this week");
			return;
		}
		if (card?.status === "PRIZE_CLAIMED") {
			console.log(`Already claimed ${prizeSlug(card)}`);
			return;
		}

		const slug = prizeSlug(card);
		if (!slug) {
			console.error(`No claimable prize (status ${card?.status})`);
			return;
		}

		await claimOffer(accountNumber, token, slug);
		console.log(`Claimed ${slug} - check Octopus app`);
	},
};
