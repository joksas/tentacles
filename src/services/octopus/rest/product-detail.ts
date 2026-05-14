import { skipToken, useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { OCTOPUS_QUERY_KEY } from "../_constants";
import { OCTOPUS_REST_ENDPOINT } from "./_constants";

const STALE_TIME_MS = 24 * 60 * 60 * 1000;

export const ProductDetailResp = z.object({
	display_name: z.string(),
});
export type ProductDetailResp = z.infer<typeof ProductDetailResp>;

export function useProductDetail(productCode: string | undefined) {
	return useQuery({
		queryKey: [OCTOPUS_QUERY_KEY, "public", "product", productCode],
		queryFn: productCode
			? async (): Promise<ProductDetailResp> => {
					const resp = await fetch(
						`${OCTOPUS_REST_ENDPOINT}/products/${productCode}/`,
					);
					if (!resp.ok)
						throw new Error(`Product API ${resp.status} for ${productCode}`);
					return ProductDetailResp.parse(await resp.json());
				}
			: skipToken,
		staleTime: STALE_TIME_MS,
	});
}
