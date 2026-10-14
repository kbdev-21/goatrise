import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMyCustomer } from "@/api/customer/api";
import type { UpdateMyCustomerRequest } from "@/api/customer/api";
import { userKeys } from "@/api/user/query-hooks";
import type { UserDetail } from "@/api/user/api";

// cập nhật xong thì thay customer trong cache users/me, khỏi gọi lại API
export function useUpdateMyCustomer(authUserId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateMyCustomerRequest) => updateMyCustomer(request),
    onSuccess: (customer) => {
      queryClient.setQueryData<UserDetail>(userKeys.me(authUserId), (user) =>
        user ? { ...user, customer } : user
      );
    },
  });
}
