import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { usersRouter } from "./module/users/router/users.router.js";
import { auditLogsRouter } from "./module/audit/router/audit-logs.router.js";
import { suppliersRouter } from "./module/inventory/router/suppliers.router.js";
import { itemsRouter } from "./module/inventory/router/items.router.js";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
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

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
});