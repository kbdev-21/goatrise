import axiosInstance from "@/api/axios-instance.ts";
import type { Address } from "@/core/types.ts";

export async function findCustomers(params?: FindCustomersParams): Promise<Customer[]> {
  const res = await axiosInstance.get<Customer[]>("/api/customers", { params });
  return res.data;
}

export async function createCustomer(request: CreateCustomerRequest): Promise<Customer> {
  const res = await axiosInstance.post<Customer>("/api/customers", request);
  return res.data;
}

export async function updateCustomer(customerId: string, request: UpdateCustomerRequest): Promise<Customer> {
  const res = await axiosInstance.patch<Customer>(`/api/customers/${customerId}`, request);
  return res.data;
}

export async function deleteCustomer(customerId: string): Promise<void> {
  await axiosInstance.delete(`/api/customers/${customerId}`);
}

export type CustomerSocialMedia = "INSTAGRAM" | "FACEBOOK" | "ZALO" | "TIKTOK";

export type CustomerSource = CustomerSocialMedia | "WEBSITE" | "ADMIN" | "OTHER";

export type CustomerSocialMediaEntry = {
  platform: CustomerSocialMedia;
  info: string;
};

// Mirror backend: module/customers/schema/customers.schema.ts
// bigint columns serialized as number; timestamps serialized as ISO string
export type Customer = {
  id: string;
  email: string | null;
  phoneNum: string | null;
  name: string;
  normalizedName: string;
  socialMedias: CustomerSocialMediaEntry[];
  addresses: Address[];
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  note: string | null;
  source: CustomerSource;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FindCustomersParams = {
  search?: string;
  sort?: string;
  offset?: number;
  limit?: number;
};

// Mirror backend: module/customers/domain/validators.ts -> CreateCustomerRequestSchema
export type CreateCustomerRequest = {
  name: string;
  email?: string;
  phoneNum?: string;
  socialMedias?: CustomerSocialMediaEntry[];
  addresses?: Address[];
  note?: string;
  source?: CustomerSource;
};

// Mirror backend: module/customers/domain/validators.ts -> UpdateCustomerRequestSchema
export type UpdateCustomerRequest = {
  name?: string;
  phoneNum?: string;
  socialMedias?: CustomerSocialMediaEntry[];
  addresses?: Address[];
  note?: string;
  source?: CustomerSource;
};
