import { auditLogs } from "../schema/audit-logs.schema.js";

export type AuditLogBase = typeof auditLogs.$inferSelect;

export type AuditLog = AuditLogBase;
