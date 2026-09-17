import { Hono } from "hono";
import z from "zod";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import type { ContextVariables } from "../../core/types.js";
import { db } from "../../db/db.js";
import { sql } from "drizzle-orm";
import { CreateOrderRequestSchema } from "../../domain/orders/validators.js";
import { createOrder } from "../../domain/orders/orders.service.js";
import { mcpMiddleware } from "../middlewares/mcp.middleware.js";

// Stateless: SDK gọi factory để tạo McpServer mới cho mỗi HTTP request
const mcpHandler = createMcpHandler(createMcpServer);

export const mcpRouter = new Hono<{ Variables: ContextVariables }>();

mcpRouter.all("/mcp",
  mcpMiddleware,
  (c) => mcpHandler.fetch(c.req.raw)
);

function createMcpServer(): McpServer {
  const mcp = new McpServer({ name: "goatrise-mcp", version: "1.0.0" });

  mcp.registerTool(
    "get_brand_info",
    {
      description: "Get general information about the Goat Rise brand, such as its background and slogan.",
      annotations: { readOnlyHint: true }
    },
    async () => {
      return {
        content: [{ type: "text", text: "Goat Rise is a Vietnamese fashion local brand. Goat Rise's slogan is REAL IMPROVEMENTS START EVERYDAY" }]
      };
    }
  );

  mcp.registerTool(
    "get_db_schema",
    {
      description: "Get the database schema (tables, columns, data types, nullability and defaults of the public schema). Call this before writing a query so that table and column names are correct.",
      annotations: { readOnlyHint: true }
    },
    async () => {
      console.log("MCP: get_db_schema");

      const queryResult = await db.execute(sql.raw(schemaQuery))
      return {
        content: [{ type: "text", text: JSON.stringify(queryResult.rows) }]
      }
    }
  );

  mcp.registerTool(
    "read_only_db_query",
    {
      inputSchema: z.object({
        query: z.string()
      }),
      description: "Run a read-only SQL query (SELECT only) against the PostgreSQL database to retrieve the data needed for the user's request. Write statements such as INSERT, UPDATE, DELETE or DDL are rejected.",
      annotations: { readOnlyHint: true }
    },
    async ({ query }) => {
      console.log("MCP: read_only_db_query");

      if (!isQueryReadOnly(query)) {
        return {
          content: [{ type: "text", text: "error" }]
        }
      }
      const queryResult = await db.execute(sql.raw(query));
      return {
        content: [{ type: "text", text: JSON.stringify(queryResult.rows) }]
      }
    }
  );

  mcp.registerTool(
    "create_order",
    {
      inputSchema: CreateOrderRequestSchema.omit({ createdAt: true }),
      description: "Create a new order when the user requests one. Before calling this tool, ask the user follow-up questions if any of the provided information is missing or unclear. If the user does not specify the order statuses, set them to PENDING.",
    },
    async (req) => {
      console.log("MCP: create_order");

      const order = await createOrder(db, null, req);
      return {
        content: [{ type: "text", text: JSON.stringify(order) }]
      }
    }
  );

  return mcp;
}

const schemaQuery = `
  SELECT
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
  FROM information_schema.columns
  WHERE table_schema IN ('public')
  ORDER BY
    table_schema,
    table_name,
    ordinal_position;
`;

const bannedKeywords = ["insert", "update", "delete", "merge", "create", "alter", "drop", "truncate"];
function isQueryReadOnly(query: string): boolean {
  bannedKeywords.forEach(w => {
    if (query.includes(w) || query.includes(w.toUpperCase())) {
      return false;
    }
  });
  return true;
}