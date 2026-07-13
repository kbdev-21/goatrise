import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { db } from "../../../core/db.js";
import { createProduct, deleteProduct, findAllProducts, getProductDetailById, getProductDetailBySlug, updateProduct } from "../domain/products.service.js";
import { zValidator } from "@hono/zod-validator";
import { CreateProductRequestSchema, UpdateProductRequestSchema } from "../domain/validators.js";

export const productsRouter = new Hono<{ Variables: ContextVariables }>();

productsRouter.get("/api/products",
  async (c) => {
    const products = await findAllProducts(db);
    return c.json(products);
  }
);

productsRouter.get("/api/products/by-slug/:slug",
  async (c) => {
    const slug = c.req.param("slug");

    const product = await getProductDetailBySlug(db, slug);

    return c.json(product);
  }
);

productsRouter.get("/api/products/:id",
  async (c) => {
    const productId = c.req.param("id");

    const product = await getProductDetailById(db, productId);

    return c.json(product);
  }
);

productsRouter.post("/api/products",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", CreateProductRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const createReq = c.req.valid("json");

    const newProduct = await createProduct(db, currentUser.id, createReq);

    return c.json(newProduct, 201);
  }
);

productsRouter.patch("/api/products/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", UpdateProductRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const productId = c.req.param("id");
    const updateReq = c.req.valid("json");

    const updatedProduct = await updateProduct(db, currentUser.id, productId, updateReq);

    return c.json(updatedProduct);
  }
);

productsRouter.delete("/api/products/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const currentUser = c.get("currentUser");
    const productId = c.req.param("id");

    await deleteProduct(db, currentUser.id, productId);

    return c.body(null, 204);
  }
);
