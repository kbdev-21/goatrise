import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  deleteCustomer,
  findCustomers,
  updateCustomer,
  type CreateCustomerRequest,
  type FindCustomersParams,
  type UpdateCustomerRequest,
} from "@/api/customer/api.ts";

export const customerKeys = {
  all: ["customers"] as const,
  list: (params?: FindCustomersParams) => [...customerKeys.all, "list", params] as const,
  detail: (customerId: string) => [...customerKeys.all, "detail", customerId] as const,
};

export function useCustomers(params?: FindCustomersParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => findCustomers(params),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateCustomerRequest) => createCustomer(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, request }: { customerId: string; request: UpdateCustomerRequest }) =>
      updateCustomer(customerId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}
