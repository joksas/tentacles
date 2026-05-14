import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import request from "graphql-request";
import { graphql } from "#/graphql";
import type { ViewerQuery } from "#/graphql/graphql";
import { useSettings } from "#/lib/auth";
import { OCTOPUS_QUERY_KEY } from "../_constants";
import { OCTOPUS_GRAPHQL_ENDPOINT } from "./_constants";
import { fetchAuthToken } from "./token";

const STALE_TIME_MS = 5 * 60 * 1000;

const QUERY = graphql(`
  query Viewer {
    viewer {
      id
      email
      accounts {
        number
        status
        brand
      }
    }
  }
`);
export type ViewerResp = ViewerQuery;

export function useViewer() {
	const client = useQueryClient();
	const apiKey = useSettings().apiKey;

	return useQuery({
		queryKey: [OCTOPUS_QUERY_KEY, apiKey, "viewer"],
		queryFn: apiKey
			? async () => {
					const token = await fetchAuthToken(client, apiKey);
					return request(
						OCTOPUS_GRAPHQL_ENDPOINT,
						QUERY,
						{},
						{ Authorization: token },
					);
				}
			: skipToken,
		staleTime: STALE_TIME_MS,
	});
}
