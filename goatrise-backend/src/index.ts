import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { usersRouter } from "./router/http/users.router.js";
import { auditLogsRouter } from "./router/http/audit-logs.router.js";
import { suppliersRouter } from "./router/http/suppliers.router.js";
import { itemsRouter } from "./router/http/items.router.js";
import { productsRouter } from "./router/http/products.router.js";
import { collectionsRouter } from "./router/http/collections.router.js";
import { cors } from "hono/cors";
import { ordersRouter } from "./router/http/orders.router.js";
import { customersRouter } from "./router/http/customers.router.js";
import { couponsRouter } from "./router/http/coupons.router.js";
import { combosRouter } from "./router/http/combos.router.js";
import { logger } from "hono/logger";
import { except } from "hono/combine";
import { analyticsRouter } from "./router/http/analytics.router.js";
import type { ContextVariables } from "./core/types.js";
import { mcpRouter } from "./router/mcp/mcp.router.js";

const app = new Hono<{ Variables: ContextVariables }>();

app.use("*", cors());
app.use(except("/mcp", logger()));

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
app.route("/", analyticsRouter);
app.route("/", mcpRouter);

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
});