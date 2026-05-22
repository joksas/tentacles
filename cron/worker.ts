import { claimOffer } from "#/services/octopus/graphql/claim-offer";
import { fetchOffers } from "#/services/octopus/graphql/offers";
import { fetchFreshAuthToken } from "#/services/octopus/graphql/token";
import { fetchActiveAccountNumber } from "#/services/octopus/graphql/viewer";
import { COFFEE_SLUGS } from "./_constants";

export default {
	async scheduled(_event: unknown, env: Env, _ctx: unknown): Promise<void> {
		const token = await fetchFreshAuthToken(env.OCTOPUS_API_KEY);
		const accountNumber = await fetchActiveAccountNumber(token);
		const resp = await fetchOffers(accountNumber, token);
		const offers = resp.octoplusOfferGroups?.edges.flatMap((e) => e?.node?.octoplusOffers ?? []).filter((offer)=>offer.slug && COFFEE_SLUGS.includes(offer.slug)) ?? [];

		if (offers.length === 0) {
			console.log("No coffee offers found");
			return;
		}

		for (const offer of offers) {
			if (offer?.claimAbility?.canClaimOffer === true) {
				await claimOffer(accountNumber, token, offer.slug ?? "");
				console.log(`Claimed ${offer.slug} — check Octopus app for QR code`);
			} else {
				console.log(`${offer?.slug}: ${offer?.claimAbility?.cannotClaimReason}`);
			}
		}
	},
};
