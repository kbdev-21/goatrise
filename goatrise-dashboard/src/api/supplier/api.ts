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

// Mirror backend: module/inventory/schema/suppliers.schema.ts (timestamps serialized as ISO string)
export type Supplier = {
  id: string;
  name: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupplierRequest = {
  name: string;
  note?: string;
};

export type UpdateSupplierRequest = {
  name?: string;
  note?: string;
};
