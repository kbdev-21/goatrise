import { createMiddleware } from "hono/factory";
import { MCP_KEY } from "../../core/env.js";
import { HTTPException } from "hono/http-exception";

export const mcpMiddleware = createMiddleware(async(c, next) => {
  const key = c.req.query("key");
  if(!key || key != MCP_KEY) {
    throw new HTTPException(400, { message: "MCP Key not accepted" });
  }
  await next();
});