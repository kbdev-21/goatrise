import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  findUsers,
  getMe,
  updateMe,
  updateUserRole,
  type FindUsersParams,
  type UpdateUserRequest,
  type UserRole,
} from "@/api/user/api.ts";
import { useAuthStore } from "@/stores/auth.store.ts";

export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  list: (params?: FindUsersParams) => [...userKeys.all, "list", params] as const,
};

export function useMe() {
  // chỉ fetch khi đã có session -> tránh gọi /api/users/me trả 401 lúc chưa đăng nhập
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: getMe,
    enabled: !!session,
  });
}

export function useUsers(params?: FindUsersParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => findUsers(params),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateUserRequest) => updateMe(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
