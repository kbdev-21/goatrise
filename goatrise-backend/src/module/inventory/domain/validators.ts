import z from "zod";

export const CreateItemRequestSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(100),
  note: z.string().trim().optional(),
  imgUrl: z.string().trim().optional(),
  weight: z.number().int().nonnegative().optional()
});
export type CreateItemRequest = z.infer<typeof CreateItemRequestSchema>;

export const UpdateItemRequestSchema = z.object({
  sku: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  note: z.string().trim().optional(),
  imgUrl: z.string().trim().optional(),
  weight: z.number().int().nonnegative().optional()
});
export type UpdateItemRequest = z.infer<typeof UpdateItemRequestSchema>;

export const CreateSupplierRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
  note: z.string().trim().optional()
});
export type CreateSupplierRequest = z.infer<typeof CreateSupplierRequestSchema>;

export const UpdateSupplierRequestSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  note: z.string().trim().optional()
});
export type UpdateSupplierRequest = z.infer<typeof UpdateSupplierRequestSchema>;

export const ImportItemRequestSchema = z.object({
  quantity: z.number().int().positive(),
  importUnitCost: z.number().nonnegative(),
  supplierId: z.uuid().optional(),
  note: z.string().trim().optional()
});
export type ImportItemRequest = z.infer<typeof ImportItemRequestSchema>;

export const AdjustItemQuantityRequestSchema = z.object({
  quantityChange: z.number().int().refine((v) => v !== 0),
  note: z.string().trim().min(1)
});
export type AdjustItemQuantityRequest = z.infer<typeof AdjustItemQuantityRequestSchema>;
