import axiosInstance from "@/api/axios-instance";
import type { Customer } from "@/api/customer/api";

// GET /api/users/me: user lấy từ DB + customer join qua email
export async function getMe(): Promise<UserDetail> {
  const res = await axiosInstance.get<UserDetail>("/api/users/me");
  return res.data;
}

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

// Mirror backend: db/schema/users.schema.ts -> UserDb (timestamps serialized as ISO string)
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

// Mirror backend: domain/auth/types.ts -> UserDetail
// customer null khi chưa có customer trùng email (chưa đặt đơn, chưa tự cập nhật thông tin mua hàng)
export type UserDetail = User & {
  customer: Customer | null;
};
