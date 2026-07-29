import axiosInstance from "@/api/axios-instance.ts";

export async function findCombos(): Promise<Combo[]> {
  const res = await axiosInstance.get<Combo[]>("/api/combos");
  return res.data;
}

export async function findComboById(comboId: string): Promise<Combo> {
  const res = await axiosInstance.get<Combo>(`/api/combos/${comboId}`);
  return res.data;
}

export async function createCombo(request: CreateComboRequest): Promise<Combo> {
  const res = await axiosInstance.post<Combo>("/api/combos", request);
  return res.data;
}

export async function updateCombo(comboId: string, request: UpdateComboRequest): Promise<Combo> {
  const res = await axiosInstance.patch<Combo>(`/api/combos/${comboId}`, request);
  return res.data;
}

export async function deleteCombo(comboId: string): Promise<void> {
  await axiosInstance.delete(`/api/combos/${comboId}`);
}

export type ComboDiscountType = "FIXED" | "PERCENTAGE";

export type ComboConditionTargetType = "ITEM" | "PRODUCT" | "COLLECTION";

// Mirror backend: module/promotion/schema/combos.schema.ts -> ComboCondition
export type ComboCondition = {
  targetType: ComboConditionTargetType;
  targetId: string;
  quantity: number;
};

// Base: cột gốc của combo (mirror ComboBase backend)
// bigint columns serialized as number; timestamps serialized as ISO string
export type ComboBase = {
  id: string;
  code: string;
  description: string | null;
  andConditions: ComboCondition[];
  discountType: ComboDiscountType;
  discountValue: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Combo = ComboBase;

// Mirror backend: module/promotion/domain/validators.ts -> CreateComboRequestSchema
export type CreateComboRequest = {
  code: string;
  description?: string | null;
  andConditions: ComboCondition[];
  discountType: ComboDiscountType;
  discountValue: number;
  isActive?: boolean;
};

// Mirror backend: module/promotion/domain/validators.ts -> UpdateComboRequestSchema
export type UpdateComboRequest = {
  code?: string;
  description?: string | null;
  andConditions?: ComboCondition[];
  discountType?: ComboDiscountType;
  discountValue?: number;
  isActive?: boolean;
};
