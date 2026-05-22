import { describe, expect, it } from "vitest";
import { fetchCoffeeOffers } from "#/services/octopus/graphql/coffee-offers";
import { fetchAuthTokenDirect } from "#/services/octopus/graphql/token";
import { fetchActiveAccountNumber } from "#/services/octopus/graphql/viewer";

const API_KEY = process.env.OCTOPUS_API_KEY;

describe.skipIf(!API_KEY)("coffee cron", () => {
	it("checks coffee offer availability", async () => {
		const token = await fetchAuthTokenDirect(API_KEY!);
		const accountNumber = await fetchActiveAccountNumber(token);
		const resp = await fetchCoffeeOffers(accountNumber, token);
		const offers =
			resp.octoplusOfferGroups?.edges.flatMap((e) => e?.node?.octoplusOffers ?? []) ?? [];

		console.log("Offers:", JSON.stringify(offers, null, 2));
		expect(offers.length).toBeGreaterThan(0);
		for (const offer of offers) {
			expect(offer?.slug).toBeTypeOf("string");
		}
	}, 15_000);
});
