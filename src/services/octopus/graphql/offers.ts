import request from "graphql-request";
import { graphql } from "#/graphql";
import type { CoffeeOffersQuery } from "#/graphql/graphql";
import { OCTOPUS_GRAPHQL_BACKEND_ENDPOINT } from "./_constants";

const QUERY = graphql(`
  query CoffeeOffers($accountNumber: String!) {
    octoplusOfferGroups(accountNumber: $accountNumber, first: 20) {
      edges {
        node {
          octoplusOffers {
            slug
            claimAbility {
              canClaimOffer
              cannotClaimReason
            }
          }
        }
      }
    }
  }
`);
export type CoffeeOffersResp = CoffeeOffersQuery;

export async function fetchOffers(accountNumber: string, token: string) {
	return request(
		OCTOPUS_GRAPHQL_BACKEND_ENDPOINT,
		QUERY,
		{ accountNumber },
		{ Authorization: token },
	);
}
