import z from "zod";
import type { CustomerSocialMedia, CustomerSource } from "../schema/customers.schema.js";

const socialMedias = ["INSTAGRAM", "FACEBOOK", "ZALO", "TIKTOK"] satisfies CustomerSocialMedia[];
const sources = ["INSTAGRAM", "FACEBOOK", "ZALO", "TIKTOK", "WEBSITE", "ADMIN", "OTHER"] satisfies CustomerSource[];

const AddressSchema = z.object({
  countryCode: z.string(),
  provinceCode: z.string().nullable(),
  provinceName: z.string(),
  address: z.string()
});

const SocialMediaSchema = z.object({
  platform: z.enum(socialMedias),
  info: z.string().trim().min(1)
});

export const CreateCustomerRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().trim().optional(),
  phoneNum: z.string().trim().min(1).max(20).optional(),
  socialMedias: z.array(SocialMediaSchema).optional(),
  addresses: z.array(AddressSchema).optional(),
  note: z.string().trim().min(1).optional(),
  source: z.enum(sources).optional()
});
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;

export const UpdateCustomerRequestSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phoneNum: z.string().trim().min(1).max(20).optional(),
  socialMedias: z.array(SocialMediaSchema).optional(),
  addresses: z.array(AddressSchema).optional(),
  note: z.string().trim().min(1).optional(),
  source: z.enum(sources).optional()
});
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;

export const FindCustomersQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.string().default("createdAt:DESC"),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().positive().default(20)
});
export type FindCustomersQuery = z.infer<typeof FindCustomersQuerySchema>;
