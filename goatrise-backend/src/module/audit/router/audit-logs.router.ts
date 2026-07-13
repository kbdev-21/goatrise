import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { db } from "../../../core/db.js";
import { findAuditLogs } from "../domain/audit-logs.service.js";
import { zValidator } from "@hono/zod-validator";
import { FindAuditLogsQuerySchema } from "../domain/validators.js";

export const auditLogsRouter = new Hono<{ Variables: ContextVariables }>();

auditLogsRouter.get("/api/audit-logs",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", FindAuditLogsQuerySchema),
  async (c) => {
    const query = c.req.valid("query");

    const auditLogs = await findAuditLogs(db, query);

    return c.json(auditLogs);
  }
);
