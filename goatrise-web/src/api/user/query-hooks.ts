import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  findUsers,
  getMe,
  updateMe,
  updateUserRole,
  type FindUsersParams,
  type UpdateUserRequest,
  type UserRole,
} from "@/api/user/api";

export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  list: (params?: FindUsersParams) => [...userKeys.all, "list", params] as const,
};

// queryOptions: reuse cho cả loader (queryClient.ensureQueryData) lẫn component (useQuery)
export const meQueryOptions = () =>
  queryOptions({
    queryKey: userKeys.me(),
    queryFn: getMe,
  });

export const usersQueryOptions = (params?: FindUsersParams) =>
  queryOptions({
    queryKey: userKeys.list(params),
    queryFn: () => findUsers(params),
  });

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
