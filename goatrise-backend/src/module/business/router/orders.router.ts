import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { db } from "../../../core/db.js";
import { calculateOrder } from "../domain/order-calculation.service.js";
import { createOrder, findOrders } from "../domain/orders.service.js";
import type { OrderChannel, OrderStatus } from "../schema/orders.schema.js";
import { zValidator } from "@hono/zod-validator";
import { CalculateOrderRequestSchema, CreateOrderRequestSchema } from "../domain/validators.js";

export const ordersRouter = new Hono<{ Variables: ContextVariables }>();

ordersRouter.get("/api/orders",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const {
      search,
      channel,
      status,
      sort,
      offset,
      limit,
    } = c.req.query();

    const orders = await findOrders(
      db,
      search,
      channel ? (channel as OrderChannel) : undefined,
      status ? (status as OrderStatus) : undefined,
      sort,
      offset ? Number(offset) : undefined,
      limit ? Number(limit) : undefined
    );

    return c.json(orders);
  }
);

ordersRouter.post("/api/orders/calculate",
  zValidator("json", CalculateOrderRequestSchema),
  async (c) => {
    const req = c.req.valid("json");
    const calculateResult = await calculateOrder(db, req);
    return c.json(calculateResult);
  }
);

ordersRouter.post("/api/orders",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", CreateOrderRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const createReq = c.req.valid("json");

    const newOrder = await createOrder(db, currentUser.id, createReq);

    return c.json(newOrder, 201);
  }
);