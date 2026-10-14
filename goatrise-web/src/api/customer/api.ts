import axiosInstance from "@/api/axios-instance";
import type { Address, SalesChannel } from "@/api/order/api";

// PATCH /api/customers/me: user tự sửa thông tin mua hàng (customer nối qua email).
// upsert: chưa có customer thì backend tạo mới (tên mặc định lấy từ user nếu không gửi)
export async function updateMyCustomer(
  request: UpdateMyCustomerRequest
): Promise<Customer> {
  const res = await axiosInstance.patch<Customer>(
    "/api/customers/me",
    request
  );
  return res.data;
}

export type CustomerSocialMedia = "INSTAGRAM" | "FACEBOOK" | "ZALO" | "TIKTOK";

// Mirror backend: db/schema/customers.schema.ts -> CustomerDb
// bigint columns serialized as number; timestamps serialized as ISO string
export type Customer = {
  id: string;
  email: string | null;
  phoneNum: string | null;
  name: string;
  normalizedName: string;
  socialMedias: { platform: CustomerSocialMedia; info: string }[];
  addresses: Address[];
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  note: string | null;
  source: SalesChannel;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// Mirror backend: domain/customers/validators.ts -> UpdateMyCustomerRequestSchema
// field nào bỏ trống (undefined) thì backend giữ nguyên; addresses gửi lên là ghi đè cả danh sách
export type UpdateMyCustomerRequest = {
  name?: string;
  phoneNum?: string;
  addresses?: Address[];
};
