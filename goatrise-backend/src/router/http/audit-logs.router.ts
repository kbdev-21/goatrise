import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requiredRolesMiddleware } from "../middlewares/required-roles.middleware.js";
import type { ContextVariables } from "../../core/types.js";
import { db } from "../../db/db.js";
import { findAuditLogs } from "../../domain/audit/audit-logs.service.js";
import { zValidator } from "@hono/zod-validator";
import { FindAuditLogsQuerySchema } from "../../domain/audit/validators.js";

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
