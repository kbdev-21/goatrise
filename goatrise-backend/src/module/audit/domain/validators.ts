import z from "zod";

export const FindAuditLogsQuerySchema = z.object({
  search: z.string().optional(),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().positive().default(20)
});
export type FindAuditLogsQuery = z.infer<typeof FindAuditLogsQuerySchema>;
