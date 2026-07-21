import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { db } from "../../../core/db.js";
import { createCombo, deleteCombo, findCombos, getComboById, updateCombo } from "../domain/combos.service.js";
import { zValidator } from "@hono/zod-validator";
import { CreateComboRequestSchema, UpdateComboRequestSchema } from "../domain/validators.js";

export const combosRouter = new Hono<{ Variables: ContextVariables }>();

combosRouter.get("/api/combos",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const combos = await findCombos(db);

    return c.json(combos);
  }
);

combosRouter.get("/api/combos/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const comboId = c.req.param("id");

    const combo = await getComboById(db, comboId);

    return c.json(combo);
  }
);

combosRouter.post("/api/combos",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", CreateComboRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const createReq = c.req.valid("json");

    const newCombo = await createCombo(db, currentUser.id, createReq);

    return c.json(newCombo, 201);
  }
);

combosRouter.patch("/api/combos/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", UpdateComboRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const comboId = c.req.param("id");
    const updateReq = c.req.valid("json");

    const updatedCombo = await updateCombo(db, currentUser.id, comboId, updateReq);

    return c.json(updatedCombo);
  }
);

combosRouter.delete("/api/combos/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const currentUser = c.get("currentUser");
    const comboId = c.req.param("id");

    await deleteCombo(db, currentUser.id, comboId);

    return c.body(null, 204);
  }
);
