import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { db } from "../../../core/db.js";
import { createCollection, deleteCollection, findAllCollections, getCollectionById, getCollectionBySlug, updateCollection } from "../domain/collections.service.js";
import { zValidator } from "@hono/zod-validator";
import { CreateCollectionRequestSchema, UpdateCollectionRequestSchema } from "../domain/validators.js";

export const collectionsRouter = new Hono<{ Variables: ContextVariables }>();

collectionsRouter.get("/api/collections",
  async (c) => {
    const collections = await findAllCollections(db);
    return c.json(collections);
  }
);

collectionsRouter.get("/api/collections/by-slug/:slug",
  async (c) => {
    const slug = c.req.param("slug");

    const collection = await getCollectionBySlug(db, slug);

    return c.json(collection);
  }
);

collectionsRouter.get("/api/collections/:id",
  async (c) => {
    const collectionId = c.req.param("id");

    const collection = await getCollectionById(db, collectionId);

    return c.json(collection);
  }
);

collectionsRouter.post("/api/collections",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", CreateCollectionRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const createReq = c.req.valid("json");

    const newCollection = await createCollection(db, currentUser.id, createReq);

    return c.json(newCollection, 201);
  }
);

collectionsRouter.patch("/api/collections/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", UpdateCollectionRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const collectionId = c.req.param("id");
    const updateReq = c.req.valid("json");

    const updatedCollection = await updateCollection(db, currentUser.id, collectionId, updateReq);

    return c.json(updatedCollection);
  }
);

collectionsRouter.delete("/api/collections/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const currentUser = c.get("currentUser");
    const collectionId = c.req.param("id");

    await deleteCollection(db, currentUser.id, collectionId);

    return c.body(null, 204);
  }
);
