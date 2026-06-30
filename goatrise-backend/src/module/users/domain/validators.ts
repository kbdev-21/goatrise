import z from "zod";
import type { UserRole } from "../schema/users.schema.js";

const phoneRegex = /^(0|\+84)[3578][0-9]{8}$/;
const roles = ["CUSTOMER", "STAFF", "ADMIN"] satisfies UserRole[];

export const CreateUserRequestSchema = z.object({
  fullName: z.string().trim().max(50).regex(/^[\p{L}\s'-]+$/u),
  email: z.email().trim(),
  role: z.enum(roles),
  phoneNum: z.string().trim().regex(phoneRegex).optional(),
  avtUrl: z.string().trim().optional()
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const UpdateUserRequestSchema = z.object({
  fullName: z.string().trim().max(50).regex(/^[\p{L}\s'-]+$/u).optional(),
  phoneNum: z.string().trim().regex(phoneRegex).optional(),
  avtUrl: z.string().trim().optional()
});
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export const UpdateUserRoleRequestSchema = z.object({
  role: z.enum(roles)
});
export type UpdateUserRoleRequest = z.infer<typeof UpdateUserRoleRequestSchema>;