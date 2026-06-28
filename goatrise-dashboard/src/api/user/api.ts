import axiosInstance from "@/api/axios-instance.ts";

export async function getMe(): Promise<User> {
  const res = await axiosInstance.get<User>("/api/users/me");
  return res.data;
}

export async function findUsers(params?: FindUsersParams): Promise<User[]> {
  const res = await axiosInstance.get<User[]>("/api/users", { params });
  return res.data;
}

export async function updateMe(request: UpdateUserRequest): Promise<User> {
  const res = await axiosInstance.patch<User>("/api/users/me", request);
  return res.data;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  const res = await axiosInstance.post<User>(`/api/users/${userId}/update-role`, { role });
  return res.data;
}

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

// Mirror backend: module/users/schema/users.schema.ts (timestamps serialized as ISO string)
export type User = {
  id: string;
  role: UserRole;
  fullName: string;
  normalizedFullName: string;
  email: string;
  phoneNum: string | null;
  avtUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FindUsersParams = {
  search?: string;
  role?: UserRole;
  sort?: string;
  offset?: number;
  limit?: number;
};

export type UpdateUserRequest = {
  fullName?: string;
  phoneNum?: string;
  avtUrl?: string;
};
