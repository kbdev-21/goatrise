import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { usersRouter } from "./module/auth/router/users.router.js";
import { auditLogsRouter } from "./module/audit/router/audit-logs.router.js";
import { suppliersRouter } from "./module/inventory/router/suppliers.router.js";
import { itemsRouter } from "./module/inventory/router/items.router.js";
import { productsRouter } from "./module/catalog/router/products.router.js";
import { collectionsRouter } from "./module/catalog/router/collections.router.js";
import { cors } from "hono/cors";
import { ordersRouter } from "./module/orders/router/orders.router.js";
import { customersRouter } from "./module/customers/router/customers.router.js";
import { couponsRouter } from "./module/promotion/router/coupons.router.js";
import { combosRouter } from "./module/promotion/router/combos.router.js";
import { DASHBOARD_URL, WEBSITE_URL } from "./core/env.js";

const app = new Hono();

const corsOrigins = [
  DASHBOARD_URL,
  WEBSITE_URL
];
app.use("*", cors({
  origin: corsOrigins,
  allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.get("/hello", (c) => {
  return c.text("Hello world");
});

app.route("/", usersRouter);
app.route("/", auditLogsRouter);
app.route("/", suppliersRouter);
app.route("/", itemsRouter);
app.route("/", productsRouter);
app.route("/", collectionsRouter);
app.route("/", ordersRouter);
app.route("/", customersRouter);
app.route("/", couponsRouter);
app.route("/", combosRouter);

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
});