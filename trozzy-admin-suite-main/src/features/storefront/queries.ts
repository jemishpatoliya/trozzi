import { useMutation, useQuery } from "@tanstack/react-query";

import { createOrder, getOrder, getPublicProductBySlug, listPublicProducts } from "./api";
import type { OrderCreateInput } from "./types";

const keys = {
  products: ["storefront", "products"] as const,
  productBySlug: (slug: string) => ["storefront", "product", slug] as const,
  order: (id: string) => ["storefront", "order", id] as const,
};

export function usePublicProductsQuery() {
  return useQuery({
    queryKey: keys.products,
    queryFn: listPublicProducts,
    staleTime: 20_000,
  });
}

export function usePublicProductBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? keys.productBySlug(slug) : ["storefront", "product", "missing"],
    queryFn: () => {
      if (!slug) throw new Error("Missing slug");
      return getPublicProductBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 20_000,
  });
}

export function useCreateOrderMutation() {
  return useMutation({
    mutationFn: (input: OrderCreateInput) => createOrder(input),
  });
}

export function useOrderQuery(id: string | undefined) {
  return useQuery({
    queryKey: id ? keys.order(id) : ["storefront", "order", "missing"],
    queryFn: () => {
      if (!id) throw new Error("Missing order id");
      return getOrder(id);
    },
    enabled: !!id,
    staleTime: 5_000,
  });
}
