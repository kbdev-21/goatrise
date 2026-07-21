import z from "zod";

const LanguageStringSchema = z.object({
  vi: z.string().trim().min(1),
  en: z.string().trim().min(1)
});

const ItemAttributeSchema = z.enum(["COLOR", "SIZE"]);

const ItemIdsSchema = z.array(z.uuid())
  .refine((arr) => new Set(arr).size === arr.length, { message: "itemIds must not contain duplicates" });

const ProductIdsSchema = z.array(z.uuid())
  .refine((arr) => new Set(arr).size === arr.length, { message: "productIds must not contain duplicates" });

export const CreateProductRequestSchema = z.object({
  slug: z.string().trim().min(1),
  title: LanguageStringSchema,
  shortDescription: LanguageStringSchema,
  markdownDescription: LanguageStringSchema.optional(),
  imgUrls: z.array(z.string().trim().min(1)).optional(),
  displayPrice: z.number().int().nonnegative().optional(),
  comparePrice: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  requiredAttributes: z.array(ItemAttributeSchema),
  itemIds: ItemIdsSchema.optional()
});
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const UpdateProductRequestSchema = z.object({
  slug: z.string().trim().min(1).optional(),
  title: LanguageStringSchema.optional(),
  shortDescription: LanguageStringSchema.optional(),
  markdownDescription: LanguageStringSchema.optional(),
  imgUrls: z.array(z.string().trim().min(1)).optional(),
  displayPrice: z.number().int().nonnegative().optional(),
  comparePrice: z.number().int().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
  requiredAttributes: z.array(ItemAttributeSchema).optional(),
  itemIds: ItemIdsSchema.optional()
});
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

export const CreateCollectionRequestSchema = z.object({
  slug: z.string().trim().min(1),
  type: z.enum(["COLLECTION", "CATEGORY", "EVENT"]),
  title: LanguageStringSchema,
  shortDescription: LanguageStringSchema,
  imgUrl: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
  productIds: ProductIdsSchema.optional()
});
export type CreateCollectionRequest = z.infer<typeof CreateCollectionRequestSchema>;

export const UpdateCollectionRequestSchema = z.object({
  slug: z.string().trim().min(1).optional(),
  type: z.enum(["COLLECTION", "CATEGORY", "EVENT"]).optional(),
  title: LanguageStringSchema.optional(),
  shortDescription: LanguageStringSchema.optional(),
  imgUrl: z.string().trim().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
  productIds: ProductIdsSchema.optional()
});
export type UpdateCollectionRequest = z.infer<typeof UpdateCollectionRequestSchema>;
