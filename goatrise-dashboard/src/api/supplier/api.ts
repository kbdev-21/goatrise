import axiosInstance from "@/api/axios-instance.ts";

export async function findSuppliers(): Promise<Supplier[]> {
  const res = await axiosInstance.get<Supplier[]>("/api/suppliers");
  return res.data;
}

export async function createSupplier(request: CreateSupplierRequest): Promise<Supplier> {
  const res = await axiosInstance.post<Supplier>("/api/suppliers", request);
  return res.data;
}

export async function updateSupplier(supplierId: string, request: UpdateSupplierRequest): Promise<Supplier> {
  const res = await axiosInstance.patch<Supplier>(`/api/suppliers/${supplierId}`, request);
  return res.data;
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  await axiosInstance.delete(`/api/suppliers/${supplierId}`);
}

// Base: cột gốc của supplier (mirror SupplierBase backend)
export type SupplierBase = {
  id: string;
  name: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Supplier = SupplierBase;

export type CreateSupplierRequest = {
  name: string;
  note?: string;
};

export type UpdateSupplierRequest = {
  name?: string;
  note?: string;
};
