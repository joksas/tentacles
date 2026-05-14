import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import request from "graphql-request";
import { graphql } from "#/graphql";
import type { BillsQuery } from "#/graphql/graphql";
import { useSettings } from "#/lib/auth";
import { OCTOPUS_QUERY_KEY } from "../_constants";
import { OCTOPUS_GRAPHQL_ENDPOINT } from "./_constants";
import { fetchAuthToken } from "./token";

const STALE_TIME_MS = 5 * 60 * 1000;

const QUERY = graphql(`
  query Bills($accountNumber: String!, $first: Int!) {
    account(accountNumber: $accountNumber) {
      bills(first: $first) {
        edges {
          node {
            __typename
            id
            billType
            fromDate
            toDate
            issuedDate
            attachments {
              edges {
                node {
                  filename
                  temporaryUrl
                }
              }
            }
            ... on StatementType {
              closingBalance
              openingBalance
              transactions(first: 100) {
                edges {
                  node {
                    __typename
                    id
                    title
                    postedDate
                    amounts {
                      net
                      tax
                      gross
                    }
                    ... on Charge {
                      isExport
                      consumption {
                        startDate
                        endDate
                        quantity
                        unit
                        usageCost
                      }
                    }
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`);
export type BillsResp = BillsQuery;

export function useBills(accountNumber: string | undefined, first = 100) {
	const client = useQueryClient();
	const apiKey = useSettings().apiKey;

	return useQuery({
		queryKey: [OCTOPUS_QUERY_KEY, apiKey, "bills", accountNumber, first],
		queryFn:
			apiKey && accountNumber
				? async () => {
						const token = await fetchAuthToken(client, apiKey);
						return request(
							OCTOPUS_GRAPHQL_ENDPOINT,
							QUERY,
							{ accountNumber, first },
							{ Authorization: token },
						);
					}
				: skipToken,
		staleTime: STALE_TIME_MS,
	});
}
