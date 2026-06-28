import { db } from "../../../core/db.js";

const baseAuditLogQuery = db.query.auditLogs.findFirst();

export type AuditLog = NonNullable<Awaited<typeof baseAuditLogQuery>>;