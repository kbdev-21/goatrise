import type { DbExec } from "../../../core/db.js";
import { auditLogs } from "../schema/audit-logs.schema.js";
import { uuidv7 } from "uuidv7";
import type { AuditLog } from "./types.js";
import type { FindAuditLogsQuery } from "./validators.js";

export async function findAuditLogs(db: DbExec, query: FindAuditLogsQuery): Promise<AuditLog[]> {
  const { search, offset, limit } = query;
  return await db.query.auditLogs.findMany({
    where: search ? {
      OR: [
        { RAW: (t, { sql }) => sql`${t.id}::text ilike ${`%${search}%`}` },
        { actorId: { ilike: `%${search}%` } },
        { code: { ilike: `%${search}%` } },
        { referenceType: { ilike: `%${search}%` } },
        { referenceId: { ilike: `%${search}%` } }
      ]
    } : undefined,
    offset: offset,
    limit: limit,
    orderBy: { createdAt: "desc" }
  });
}

export async function recordAuditLog(db: DbExec, audit: {
  actorId?: string | null;
  code: string;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: unknown;
}) {
  await db.insert(auditLogs).values({
    id: uuidv7(),
    actorId: audit.actorId,
    code: audit.code,
    referenceType: audit.referenceType,
    referenceId: audit.referenceId,
    metadata: audit.metadata
  });
}
