import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { createItem, deleteItem, findAllItems, updateItemInfo } from "../domain/items.service.js";
import { importItem, manualAdjustItemStock } from "../domain/inventory.service.js";
import { findItemTransactions } from "../domain/item-transactions.service.js";
import type { ItemTransactionType } from "../schema/item-transactions.schema.js";
import { zValidator } from "@hono/zod-validator";
import { AdjustItemStockRequestSchema, CreateItemRequestSchema, ImportItemRequestSchema, UpdateItemRequestSchema } from "../domain/validators.js";

export const itemsRouter = new Hono<{ Variables: ContextVariables }>();

itemsRouter.get("/api/items",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const items = await findAllItems();
    return c.json(items);
  }
);

itemsRouter.post("/api/items",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", CreateItemRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const createReq = c.req.valid("json");

    const newItem = await createItem(currentUser.id, createReq);

    return c.json(newItem, 201);
  }
);

itemsRouter.patch("/api/items/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", UpdateItemRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const itemId = c.req.param("id");
    const updateReq = c.req.valid("json");

    const updatedItem = await updateItemInfo(currentUser.id, itemId, updateReq);

    return c.json(updatedItem);
  }
);

itemsRouter.delete("/api/items/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const currentUser = c.get("currentUser");
    const itemId = c.req.param("id");

    await deleteItem(currentUser.id, itemId);

    return c.body(null, 204);
  }
);

itemsRouter.post("/api/items/:id/import",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", ImportItemRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const itemId = c.req.param("id");
    const importReq = c.req.valid("json");

    const updatedItem = await importItem(currentUser.id, itemId, importReq);

    return c.json(updatedItem);
  }
);

itemsRouter.post("/api/items/:id/adjust",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", AdjustItemStockRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const itemId = c.req.param("id");
    const adjustReq = c.req.valid("json");

    const updatedItem = await manualAdjustItemStock(currentUser.id, itemId, adjustReq);

    return c.json(updatedItem);
  }
);

itemsRouter.get("/api/items/:id/transactions",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const itemId = c.req.param("id");
    const {
      type,
      offset,
      limit,
    } = c.req.query();

    const transactions = await findItemTransactions(
      itemId,
      type ? (type as ItemTransactionType) : undefined,
      offset ? Number(offset) : undefined,
      limit ? Number(limit) : undefined
    );

    return c.json(transactions);
  }
);
