import { describe, expect, it } from "vitest";
import { fetchOffers } from "#/services/octopus/graphql/offers";
import { fetchFreshAuthToken } from "#/services/octopus/graphql/token";
import { fetchActiveAccountNumber } from "#/services/octopus/graphql/viewer";
import { COFFEE_SLUGS } from "./_constants";

const API_KEY = process.env.OCTOPUS_API_KEY;

describe.skipIf(!API_KEY)("coffee cron", () => {
	it("checks coffee offer availability", async () => {
		const token = await fetchFreshAuthToken(API_KEY!);
		const accountNumber = await fetchActiveAccountNumber(token);
		const resp = await fetchOffers(accountNumber, token);
		const offers =
			resp.octoplusOfferGroups?.edges.flatMap((e) => e?.node?.octoplusOffers ?? []).filter((offer)=>offer.slug && COFFEE_SLUGS.includes(offer.slug)) ?? [];

		console.log("Offers:", JSON.stringify(offers, null, 2));
		expect(offers.length).toBeGreaterThan(0);
		for (const offer of offers) {
			expect(offer.slug).toBeTypeOf("string");
		}
	}, 15_000);
});
