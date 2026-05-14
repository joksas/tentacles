import * as z from "zod";

export const OCTOPUS_REST_ENDPOINT = "https://api.octopus.energy/v1";

export const UnitRateResp = z.object({
	value_exc_vat: z.number(),
	value_inc_vat: z.number(),
	valid_from: z.string().nullable(),
	valid_to: z.string().nullable(),
	payment_method: z.string().nullable(),
});
export type UnitRateResp = z.infer<typeof UnitRateResp>;

const RatePageResp = z.object({
	next: z.string().nullable(),
	results: z.array(UnitRateResp),
});

export async function fetchAllPages(url: string): Promise<UnitRateResp[]> {
	const all: UnitRateResp[] = [];
	let nextUrl: string | null = url;
	while (nextUrl) {
		const resp = await fetch(nextUrl);
		if (!resp.ok) throw new Error(`Rates API ${resp.status}`);
		const page = RatePageResp.parse(await resp.json());
		all.push(...page.results);
		nextUrl = page.next;
	}
	return all;
}
