import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { db } from "../../../core/db.js";
import { createItem, deleteItem, findAllItems, getItemById, updateItemInfo } from "../domain/items.service.js";
import { importItem, manualAdjustItemStock } from "../domain/inventory.service.js";
import { findItemTransactions } from "../domain/item-transactions.service.js";
import { zValidator } from "@hono/zod-validator";
import { AdjustItemStockRequestSchema, CreateItemRequestSchema, ImportItemRequestSchema, UpdateItemRequestSchema, FindItemTransactionsQuerySchema } from "../domain/validators.js";

export const itemsRouter = new Hono<{ Variables: ContextVariables }>();

itemsRouter.get("/api/items",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const items = await findAllItems(db);
    return c.json(items);
  }
);

itemsRouter.get("/api/items/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const itemId = c.req.param("id");

    const item = await getItemById(db, itemId);

    return c.json(item);
  }
);

itemsRouter.post("/api/items",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", CreateItemRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const createReq = c.req.valid("json");

    const newItem = await createItem(db, currentUser.id, createReq);

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

    const updatedItem = await updateItemInfo(db, currentUser.id, itemId, updateReq);

    return c.json(updatedItem);
  }
);

itemsRouter.delete("/api/items/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const currentUser = c.get("currentUser");
    const itemId = c.req.param("id");

    await deleteItem(db, currentUser.id, itemId);

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

    const updatedItem = await importItem(db, currentUser.id, itemId, importReq);

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

    const updatedItem = await manualAdjustItemStock(db, currentUser.id, itemId, adjustReq);

    return c.json(updatedItem);
  }
);

itemsRouter.get("/api/items/:id/transactions",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", FindItemTransactionsQuerySchema),
  async (c) => {
    const itemId = c.req.param("id");
    const query = c.req.valid("query");

    const transactions = await findItemTransactions(db, itemId, query);

    return c.json(transactions);
  }
);
