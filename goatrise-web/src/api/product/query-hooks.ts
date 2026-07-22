import { queryOptions } from "@tanstack/react-query";
import { findAllProducts, getProductById, getProductBySlug } from "@/api/product/api";

export const productKeys = {
  all: ["products"] as const,
  list: () => [...productKeys.all, "list"] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
  detailBySlug: (slug: string) => [...productKeys.all, "detail", "by-slug", slug] as const,
};

// queryOptions: reuse cho cả loader (queryClient.ensureQueryData) lẫn component (useQuery)
export const productsQueryOptions = () =>
  queryOptions({
    queryKey: productKeys.list(),
    queryFn: findAllProducts,
  });

export const productQueryOptions = (id: string) =>
  queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductById(id),
  });

export const productBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: productKeys.detailBySlug(slug),
    queryFn: () => getProductBySlug(slug),
  });
