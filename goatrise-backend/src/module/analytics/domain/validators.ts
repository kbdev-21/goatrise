import z from "zod";

export const AnalyticsRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});
export type AnalyticsRangeQuery = z.infer<typeof AnalyticsRangeQuerySchema>;

// khoảng bắt buộc (dùng cho các endpoint gộp theo thời gian, vd daily-revenue)
export const AnalyticsRequiredRangeQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date()
});
export type AnalyticsRequiredRangeQuery = z.infer<typeof AnalyticsRequiredRangeQuerySchema>;
