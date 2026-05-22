import request from "graphql-request";
import { graphql } from "#/graphql";
import type { ClaimCoffeeOfferMutation } from "#/graphql/graphql";
import { USER_AGENT } from "../_constants";
import { OCTOPUS_GRAPHQL_BACKEND_ENDPOINT } from "./_constants";

// claimOctoplusReward deprecated 2026-02-10, scheduled for removal 2026-08-10
const MUTATION = graphql(`
  mutation ClaimCoffeeOffer($accountNumber: String!, $offerSlug: String!) {
    claimOctoplusReward(accountNumber: $accountNumber, offerSlug: $offerSlug) {
      rewardId
    }
  }
`);
export type ClaimCoffeeOfferResp = ClaimCoffeeOfferMutation;

export async function claimOffer(
	accountNumber: string,
	token: string,
	slug: string,
) {
	return request(
		OCTOPUS_GRAPHQL_BACKEND_ENDPOINT,
		MUTATION,
		{ accountNumber, offerSlug: slug },
		{ Authorization: token, "User-Agent": USER_AGENT },
	);
}
