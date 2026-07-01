import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  findProductById,
  findProductBySlug,
  findProducts,
  updateProduct,
  type CreateProductRequest,
  type UpdateProductRequest,
} from "@/api/product/api.ts";

export const productKeys = {
  all: ["products"] as const,
  list: () => [...productKeys.all, "list"] as const,
  detail: (productId: string) => [...productKeys.all, "detail", productId] as const,
  bySlug: (slug: string) => [...productKeys.all, "by-slug", slug] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: findProducts,
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => findProductById(productId),
    enabled: !!productId,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: productKeys.bySlug(slug),
    queryFn: () => findProductBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateProductRequest) => createProduct(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, request }: { productId: string; request: UpdateProductRequest }) =>
      updateProduct(productId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
