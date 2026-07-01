import z from "zod";

const LanguageStringSchema = z.object({
  vi: z.string().trim().min(1),
  en: z.string().trim().min(1)
});

const ItemAttributeSchema = z.enum(["COLOR", "SIZE"]);

const ItemIdsSchema = z.array(z.uuid())
  .refine((arr) => new Set(arr).size === arr.length, { message: "itemIds must not contain duplicates" });

export const CreateProductRequestSchema = z.object({
  slug: z.string().trim().min(1),
  title: LanguageStringSchema,
  shortDescription: LanguageStringSchema,
  markdownDescription: LanguageStringSchema.optional(),
  imgUrls: z.array(z.string().trim().min(1)).optional(),
  displayPrice: z.number().nonnegative().optional(),
  comparePrice: z.number().nonnegative().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
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
  displayPrice: z.number().nonnegative().optional(),
  comparePrice: z.number().nonnegative().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  requiredAttributes: z.array(ItemAttributeSchema).optional(),
  itemIds: ItemIdsSchema.optional()
});
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;
