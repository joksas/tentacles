// One-off script: list all Octoplus offer slugs to find the scratchcard slug.
// Run with: ./node_modules/.bin/tsx --env-file=.env cron/list-offers.ts
import request from "graphql-request";
import {
	OCTOPUS_GRAPHQL_BACKEND_ENDPOINT,
	OCTOPUS_GRAPHQL_ENDPOINT,
} from "../src/services/octopus/graphql/_constants";
import { USER_AGENT } from "../src/services/octopus/_constants";

const TOKEN_MUTATION = `
  mutation ObtainKrakenToken($apiKey: String!) {
    obtainKrakenToken(input: { APIKey: $apiKey }) {
      token
    }
  }
`;

const OFFERS_QUERY = `
  query Offers($accountNumber: String!) {
    octoplusOfferGroups(accountNumber: $accountNumber, first: 20) {
      edges {
        node {
          octoplusOffers {
            slug
            name
            partnerName
            claimAbility {
              canClaimOffer
              cannotClaimReason
            }
          }
        }
      }
    }
  }
`;

const VIEWER_QUERY = `
  query Viewer {
    viewer {
      accounts {
        number
      }
    }
  }
`;

const apiKey = process.env.OCTOPUS_API_KEY;
if (!apiKey) throw new Error("OCTOPUS_API_KEY not set");

const tokenResp = await request(OCTOPUS_GRAPHQL_ENDPOINT, TOKEN_MUTATION, {
	apiKey,
});
const token = tokenResp.obtainKrakenToken?.token;
if (!token) throw new Error("NO_TOKEN");

const headers = { Authorization: token, "User-Agent": USER_AGENT };

const viewer = await request(
	OCTOPUS_GRAPHQL_ENDPOINT,
	VIEWER_QUERY,
	{},
	headers,
);
const account =
	viewer.viewer?.accounts?.find(
		(a: { number?: string | null } | null | undefined) => a?.number,
	)?.number ?? undefined;
if (!account) throw new Error("No active account found");
console.log(`Account: ${account}`);

let resp;
for (let attempt = 1; attempt <= 5; attempt++) {
	try {
		resp = await request(
			OCTOPUS_GRAPHQL_BACKEND_ENDPOINT,
			OFFERS_QUERY,
			{ accountNumber: account },
			headers,
		);
		break;
	} catch (err) {
		console.error(`Attempt ${attempt} failed: ${(err as Error).message.split("\n")[0]}`);
		if (attempt === 5) throw err;
		await new Promise((r) => setTimeout(r, 3000 * attempt));
	}
}
const offers = resp?.octoplusOfferGroups?.edges
	.flatMap(
		(
			e: {
				node?: {
					octoplusOffers?: Array<{
						slug?: string | null;
						name?: string | null;
						partnerName?: string | null;
					} | null> | null;
				} | null;
			} | null,
		) =>
			e?.node?.octoplusOffers ?? [],
	)
	.filter(Boolean);

console.log(JSON.stringify(offers, null, 2));
