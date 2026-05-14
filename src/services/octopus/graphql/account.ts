import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import request from "graphql-request";
import { graphql } from "#/graphql";
import type { AccountQuery } from "#/graphql/graphql";
import { useSettings } from "#/lib/auth";
import { OCTOPUS_QUERY_KEY } from "../_constants";
import { OCTOPUS_GRAPHQL_ENDPOINT } from "./_constants";
import { fetchAuthToken } from "./token";

const STALE_TIME_MS = 5 * 60 * 1_000;

const QUERY = graphql(`
  query Account($accountNumber: String!) {
    account(accountNumber: $accountNumber) {
      number
      status
      billingName
    }
  }
`);
export type AccountResp = AccountQuery;

export function useAccount(accountNumber: string | undefined) {
	const client = useQueryClient();
	const apiKey = useSettings().apiKey;

	return useQuery({
		queryKey: [OCTOPUS_QUERY_KEY, apiKey, "account", accountNumber],
		queryFn:
			apiKey && accountNumber
				? async () => {
						const token = await fetchAuthToken(client, apiKey);
						return request(
							OCTOPUS_GRAPHQL_ENDPOINT,
							QUERY,
							{ accountNumber },
							{ Authorization: token },
						);
					}
				: skipToken,
		staleTime: STALE_TIME_MS,
	});
}
