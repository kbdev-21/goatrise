import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { findAuditLogs } from "../domain/audit-logs.service.js";

export const auditLogsRouter = new Hono<{ Variables: ContextVariables }>();

auditLogsRouter.get("/api/audit-logs",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const {
      search,
      offset,
      limit,
    } = c.req.query();

    const auditLogs = await findAuditLogs(
      search,
      offset ? Number(offset) : undefined,
      limit ? Number(limit) : undefined
    );

    return c.json(auditLogs);
  }
);
