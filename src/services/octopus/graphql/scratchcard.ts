import request from "graphql-request";
import { USER_AGENT } from "../_constants";
import { OCTOPUS_GRAPHQL_BACKEND_ENDPOINT } from "./_constants";

// Scratchcard fields exist only on the backend endpoint and are absent from the codegen schema, so they are typed by hand.
export type ScratchcardOffer = {
	slug: string | null;
	name: string | null;
	partnerName: string | null;
};

export type Scratchcard = {
	externalReference: string | null;
	status:
		| "DID_NOT_WIN"
		| "PRIZE_NOT_YET_CLAIMED"
		| "PRIZE_CLAIMED"
		| "PRIZE_REJECTED"
		| "PRIZE_NOT_CLAIMED_IN_TIME"
		| null;
	offer: ScratchcardOffer | null;
	prize: ({ __typename: string } & Partial<ScratchcardOffer>) | null;
};

export type ActiveScratchcardResp = {
	octoplusActiveScratchcardData: {
		activeSession: {
			externalReference: string | null;
			startsAt: string | null;
			endsAt: string | null;
		} | null;
		scratchcard: Scratchcard | null;
	} | null;
};

export type ScratchResp = {
	scratchOctoplusScratchcard: { scratchcard: Scratchcard | null } | null;
};

const SCRATCHCARD_FIELDS = `
  externalReference
  status
  offer { slug name partnerName }
  prize {
    __typename
    ... on OctoplusOfferType { slug name partnerName }
  }
`;

const ACTIVE_QUERY = `
  query ActiveScratchcard($accountNumber: String!) {
    octoplusActiveScratchcardData(accountNumber: $accountNumber) {
      activeSession { externalReference startsAt endsAt }
      scratchcard { ${SCRATCHCARD_FIELDS} }
    }
  }
`;

const SCRATCH_MUTATION = `
  mutation ScratchScratchcard($accountNumber: String!, $sessionExternalReference: UUID!) {
    scratchOctoplusScratchcard(
      input: {
        accountNumber: $accountNumber
        scratchcardSessionExternalReference: $sessionExternalReference
      }
    ) {
      scratchcard { ${SCRATCHCARD_FIELDS} }
    }
  }
`;

function headers(token: string) {
	return { Authorization: token, "User-Agent": USER_AGENT };
}

export async function fetchActiveScratchcard(
	accountNumber: string,
	token: string,
) {
	return request<ActiveScratchcardResp>(
		OCTOPUS_GRAPHQL_BACKEND_ENDPOINT,
		ACTIVE_QUERY,
		{ accountNumber },
		headers(token),
	);
}

export async function scratchScratchcard(
	accountNumber: string,
	token: string,
	sessionExternalReference: string,
) {
	return request<ScratchResp>(
		OCTOPUS_GRAPHQL_BACKEND_ENDPOINT,
		SCRATCH_MUTATION,
		{ accountNumber, sessionExternalReference },
		headers(token),
	);
}

// The prize offer is the claimable one; the card's own offer is the fallback label.
export function prizeSlug(card: Scratchcard | null): string | undefined {
	if (card?.prize?.__typename === "OctoplusOfferType") {
		return card.prize.slug ?? undefined;
	}
	return card?.offer?.slug ?? undefined;
}
