import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requiredRolesMiddleware } from "../middlewares/required-roles.middleware.js";
import type { ContextVariables } from "../../core/types.js";
import { db } from "../../db/db.js";
import { createSupplier, deleteSupplier, findAllSuppliers, updateSupplier } from "../../domain/inventory/suppliers.service.js";
import { zValidator } from "@hono/zod-validator";
import { CreateSupplierRequestSchema, UpdateSupplierRequestSchema } from "../../domain/inventory/validators.js";

export const suppliersRouter = new Hono<{ Variables: ContextVariables }>();

suppliersRouter.get("/api/suppliers",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const suppliers = await findAllSuppliers(db);
    return c.json(suppliers);
  }
);

suppliersRouter.post("/api/suppliers",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", CreateSupplierRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const createReq = c.req.valid("json");

    const newSupplier = await createSupplier(db, currentUser.id, createReq);

    return c.json(newSupplier, 201);
  }
);

suppliersRouter.patch("/api/suppliers/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", UpdateSupplierRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const supplierId = c.req.param("id");
    const updateReq = c.req.valid("json");

    const updatedSupplier = await updateSupplier(db, currentUser.id, supplierId, updateReq);

    return c.json(updatedSupplier);
  }
);

suppliersRouter.delete("/api/suppliers/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const currentUser = c.get("currentUser");
    const supplierId = c.req.param("id");

    await deleteSupplier(db, currentUser.id, supplierId);

    return c.body(null, 204);
  }
);
