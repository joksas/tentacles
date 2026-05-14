import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { OCTOPUS_QUERY_KEY } from "../_constants";
import { OCTOPUS_REST_ENDPOINT } from "./_constants";

const STALE_TIME_MS = 4 * 60 * 60 * 1000;

export const ProductsResp = z.object({
	results: z.array(
		z.object({
			code: z.string(),
			full_name: z.string(),
			display_name: z.string(),
			available_from: z.string().nullable(),
			available_to: z.string().nullable(),
		}),
	),
});
export type ProductsResp = z.infer<typeof ProductsResp>;

type KnownTariff = "flexible" | "agile" | "go";

const TARIFF_MATCHERS: Record<KnownTariff, RegExp> = {
	flexible: /flexible octopus/i,
	agile: /agile octopus/i,
	go: /octopus go/i,
};

async function fetchCurrentProducts(): Promise<{
	flexible: string;
	agile: string;
	go?: string;
}> {
	const resp = await fetch(
		`${OCTOPUS_REST_ENDPOINT}/products/?is_variable=true&brand=OCTOPUS_ENERGY&page_size=50`,
	);
	if (!resp.ok) throw new Error(`Products API ${resp.status}`);
	const { results } = ProductsResp.parse(await resp.json());

	const sorted = results
		.filter((p) => !p.available_to || new Date(p.available_to) > new Date())
		.sort((a, b) =>
			(b.available_from ?? "").localeCompare(a.available_from ?? ""),
		);

	const found: Partial<Record<KnownTariff, string>> = {};
	for (const [key, re] of Object.entries(TARIFF_MATCHERS) as [
		KnownTariff,
		RegExp,
	][]) {
		const match = sorted.find(
			(p) => re.test(p.full_name) || re.test(p.display_name),
		);
		if (match) found[key] = match.code;
	}

	if (!found.flexible || !found.agile) {
		throw new Error(
			`Could not discover tariff products. Found: ${JSON.stringify(found)}`,
		);
	}

	return found as { flexible: string; agile: string; go?: string };
}

export function useCurrentProducts() {
	return useQuery({
		queryKey: [OCTOPUS_QUERY_KEY, "public", "products"],
		queryFn: fetchCurrentProducts,
		staleTime: STALE_TIME_MS,
	});
}
