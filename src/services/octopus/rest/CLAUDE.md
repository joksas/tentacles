- One file per API endpoint
- @src/services/octopus/rest/_constants.ts: Constants shared by all endpoints
- File structure:
```tsx
import { y } from "w";

const STALE_TIME_MS = 24 * 60 * 60 * 1000;
const getEndpoint = (param: string) => `abc/${param}/`

export const AbcResp = z.object({
	field: z.string(),
});
export type AbcResp = z.infer<typeof AbcResp>;

export function useAbc(param: string | undefined) {
	return useQuery({
		queryKey: [OCTOPUS_QUERY_KEY, "abc", param],
		queryFn: param
			? async (): Promise<AbcResp> => {
					const resp = await fetch(
						`${OCTOPUS_REST_ENDPOINT}/${getEndpoint(param)}`,
					);
					if (!resp.ok)
						throw new Error(`Abc API ${resp.status} for ${param}`);
					return AbcResp.parse(await resp.json());
				}
			: skipToken,
		staleTime: STALE_TIME_MS,
	});
}
```
