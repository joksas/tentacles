import { claimOffer } from "#/services/octopus/graphql/claim-offer";
import { fetchOffers } from "#/services/octopus/graphql/offers";
import { fetchFreshAuthToken } from "#/services/octopus/graphql/token";
import { fetchActiveAccountNumber } from "#/services/octopus/graphql/viewer";
import { getCoffeeSlugsForDay } from "./_constants";

export default {
	async scheduled(_event: unknown, env: Env, _ctx: unknown): Promise<void> {
		// Auth
		const token = await fetchFreshAuthToken(env.OCTOPUS_API_KEY);
		const accountNumber = await fetchActiveAccountNumber(token);

		// Get slugs
		const day = new Date().getUTCDay();
		const coffeeSlugs = getCoffeeSlugsForDay(day);
		console.log(`Day of week = ${day}; slugs = ${JSON.stringify(coffeeSlugs)}`);

		// Get offers
		const resp = await fetchOffers(accountNumber, token);
		const offers =
			resp.octoplusOfferGroups?.edges
				.flatMap((e) => e?.node?.octoplusOffers ?? [])
				.filter((offer) => offer.slug && coffeeSlugs.includes(offer.slug)) ??
			[];
		if (offers.length === 0) {
			console.error("No coffee offers found");
			return;
		}

		for (const offer of offers) {
			if (offer?.claimAbility?.canClaimOffer === true) {
				await claimOffer(accountNumber, token, offer.slug ?? "");
				console.log(`Claimed ${offer.slug} - check Octopus app for QR code`);
			} else {
				console.log(
					`${offer?.slug}: ${offer?.claimAbility?.cannotClaimReason}`,
				);
			}
		}
	},
};
