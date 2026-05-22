import { claimCoffeeOffer } from "#/services/octopus/graphql/coffee-claim";
import { fetchCoffeeOffers } from "#/services/octopus/graphql/coffee-offers";
import { fetchAuthTokenDirect } from "#/services/octopus/graphql/token";
import { fetchActiveAccountNumber } from "#/services/octopus/graphql/viewer";

interface Env {
	OCTOPUS_API_KEY: string;
}

export default {
	async scheduled(_event: unknown, env: Env, _ctx: unknown): Promise<void> {
		const token = await fetchAuthTokenDirect(env.OCTOPUS_API_KEY);
		const accountNumber = await fetchActiveAccountNumber(token);
		const resp = await fetchCoffeeOffers(accountNumber, token);
		const offers = resp.octoplusOfferGroups?.edges.flatMap((e) => e?.node?.octoplusOffers ?? []) ?? [];

		if (offers.length === 0) {
			console.log("No coffee offers found");
			return;
		}

		for (const offer of offers) {
			if (offer?.claimAbility?.canClaimOffer === true) {
				await claimCoffeeOffer(accountNumber, token, offer.slug ?? "");
				console.log(`Claimed ${offer.slug} — check Octopus app for QR code`);
			} else {
				console.log(`${offer?.slug}: ${offer?.claimAbility?.cannotClaimReason}`);
			}
		}
	},
};
