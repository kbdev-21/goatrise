import z from "zod";
import type { ItemTransactionType } from "../schema/item-transactions.schema.js";

const itemTransactionTypes = ["IMPORT", "ADJUST", "SOLD"] satisfies ItemTransactionType[];

const ItemAttributeValuesSchema = z.object({
  COLOR: z.string().trim().min(1).optional(),
  SIZE: z.string().trim().min(1).optional()
});

export const CreateItemRequestSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(100),
  note: z.string().trim().optional(),
  imgUrl: z.string().trim().optional(),
  weight: z.number().int().nonnegative().optional(),
  productId: z.uuid().optional(),
  price: z.number().int().nonnegative(),
  displayPriority: z.number().int().optional(),
  isActive: z.boolean().optional(),
  attributeValues: ItemAttributeValuesSchema
});
export type CreateItemRequest = z.infer<typeof CreateItemRequestSchema>;

export const UpdateItemRequestSchema = z.object({
  sku: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  note: z.string().trim().optional(),
  imgUrl: z.string().trim().optional(),
  weight: z.number().int().nonnegative().optional(),
  productId: z.uuid().optional(),
  price: z.number().int().nonnegative().optional(),
  displayPriority: z.number().int().optional(),
  isActive: z.boolean().optional(),
  attributeValues: ItemAttributeValuesSchema.optional()
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
  importUnitCost: z.number().int().nonnegative(),
  supplierId: z.uuid().optional(),
  note: z.string().trim().optional()
});
export type ImportItemRequest = z.infer<typeof ImportItemRequestSchema>;

export const AdjustItemStockRequestSchema = z.object({
  stockChange: z.number().int().refine((v) => v !== 0),
  note: z.string().trim().min(1)
});
export type AdjustItemStockRequest = z.infer<typeof AdjustItemStockRequestSchema>;

export const FindItemTransactionsQuerySchema = z.object({
  type: z.enum(itemTransactionTypes).optional(),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().positive().default(20)
});
export type FindItemTransactionsQuery = z.infer<typeof FindItemTransactionsQuerySchema>;
