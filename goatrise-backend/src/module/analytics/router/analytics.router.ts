import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { db } from "../../../core/db.js";
import { calculateDailyOrders, calculateDailyRevenue, calculateItemSales, calculateMonthlyOrders, calculateMonthlyRevenue, calculateProductSales, calculateRevenue, countCustomers, countOrders } from "../domain/analytics.service.js";
import { zValidator } from "@hono/zod-validator";
import { AnalyticsRangeQuerySchema, AnalyticsRequiredRangeQuerySchema } from "../domain/validators.js";

export const analyticsRouter = new Hono<{ Variables: ContextVariables }>();

analyticsRouter.get("/api/analytics/orders-count",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", AnalyticsRangeQuerySchema),
  async (c) => {
    const { from, to } = c.req.valid("query");

    const count = await countOrders(db, from, to);

    return c.json(count);
  }
);

analyticsRouter.get("/api/analytics/customers-count",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", AnalyticsRangeQuerySchema),
  async (c) => {
    const { from, to } = c.req.valid("query");

    const count = await countCustomers(db, from, to);

    return c.json(count);
  }
);

analyticsRouter.get("/api/analytics/revenue",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", AnalyticsRangeQuerySchema),
  async (c) => {
    const { from, to } = c.req.valid("query");

    const revenue = await calculateRevenue(db, from, to);

    return c.json(revenue);
  }
);

analyticsRouter.get("/api/analytics/daily-revenue",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", AnalyticsRequiredRangeQuerySchema),
  async (c) => {
    const { from, to } = c.req.valid("query");

    const revenue = await calculateDailyRevenue(db, from, to);

    return c.json(revenue);
  }
);

analyticsRouter.get("/api/analytics/daily-orders",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", AnalyticsRequiredRangeQuerySchema),
  async (c) => {
    const { from, to } = c.req.valid("query");

    const dailyOrders = await calculateDailyOrders(db, from, to);

    return c.json(dailyOrders);
  }
);

analyticsRouter.get("/api/analytics/monthly-revenue",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", AnalyticsRequiredRangeQuerySchema),
  async (c) => {
    const { from, to } = c.req.valid("query");

    const revenue = await calculateMonthlyRevenue(db, from, to);

    return c.json(revenue);
  }
);

analyticsRouter.get("/api/analytics/monthly-orders",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", AnalyticsRequiredRangeQuerySchema),
  async (c) => {
    const { from, to } = c.req.valid("query");

    const monthlyOrders = await calculateMonthlyOrders(db, from, to);

    return c.json(monthlyOrders);
  }
);

analyticsRouter.get("/api/analytics/product-sales",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", AnalyticsRangeQuerySchema),
  async (c) => {
    const { from, to } = c.req.valid("query");

    const sales = await calculateProductSales(db, from, to);

    return c.json(sales);
  }
);

analyticsRouter.get("/api/analytics/item-sales",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", AnalyticsRangeQuerySchema),
  async (c) => {
    const { from, to } = c.req.valid("query");

    const sales = await calculateItemSales(db, from, to);

    return c.json(sales);
  }
);
