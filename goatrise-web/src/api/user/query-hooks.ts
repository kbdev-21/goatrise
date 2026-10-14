import { queryOptions } from "@tanstack/react-query";
import { getMe } from "@/api/user/api";

export const userKeys = {
  all: ["users"] as const,
  // authUserId: tách cache theo tài khoản đăng nhập, đổi tài khoản không dính dữ liệu cũ
  me: (authUserId: string) => [...userKeys.all, "me", authUserId] as const,
};

export const meQueryOptions = (authUserId: string) =>
  queryOptions({
    queryKey: userKeys.me(authUserId),
    queryFn: getMe,
  });
