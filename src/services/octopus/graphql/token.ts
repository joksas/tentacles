import { type QueryClient, skipToken } from "@tanstack/react-query";
import request from "graphql-request";
import { graphql } from "#/graphql";
import { OCTOPUS_QUERY_KEY } from "../_constants";
import { OCTOPUS_GRAPHQL_ENDPOINT } from "./_constants";

const STALE_TIME_MS = 55 * 60 * 1000;

const MUTATION = graphql(`
  mutation ObtainKrakenToken($apiKey: String!) {
    obtainKrakenToken(input: { APIKey: $apiKey }) {
      token
    }
  }
`);

export async function fetchAuthToken(client: QueryClient, apiKey: string) {
	return client.fetchQuery({
		queryKey: [OCTOPUS_QUERY_KEY, apiKey, "token"],
		queryFn: apiKey
			? async () => {
					const data = await request(OCTOPUS_GRAPHQL_ENDPOINT, MUTATION, {
						apiKey,
					});
					const token = data.obtainKrakenToken?.token;
					if (!token) throw Error("NO_TOKEN");
					return token;
				}
			: skipToken,
		staleTime: STALE_TIME_MS,
		gcTime: 60 * 60 * 1000,
	});
}
