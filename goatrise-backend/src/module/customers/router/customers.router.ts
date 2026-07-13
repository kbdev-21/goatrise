import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { db } from "../../../core/db.js";
import { createCustomer, deleteCustomer, findCustomers, updateCustomer } from "../domain/customers.service.js";
import { zValidator } from "@hono/zod-validator";
import { CreateCustomerRequestSchema, UpdateCustomerRequestSchema, FindCustomersQuerySchema } from "../domain/validators.js";

export const customersRouter = new Hono<{ Variables: ContextVariables }>();

customersRouter.get("/api/customers",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", FindCustomersQuerySchema),
  async (c) => {
    const query = c.req.valid("query");

    const customers = await findCustomers(db, query);

    return c.json(customers);
  }
);

customersRouter.post("/api/customers",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", CreateCustomerRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const createReq = c.req.valid("json");

    const newCustomer = await createCustomer(db, currentUser.id, createReq);

    return c.json(newCustomer, 201);
  }
);

customersRouter.patch("/api/customers/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", UpdateCustomerRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const customerId = c.req.param("id");
    const updateReq = c.req.valid("json");

    const updatedCustomer = await updateCustomer(db, currentUser.id, customerId, updateReq);

    return c.json(updatedCustomer);
  }
);

customersRouter.delete("/api/customers/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const currentUser = c.get("currentUser");
    const customerId = c.req.param("id");

    await deleteCustomer(db, currentUser.id, customerId);

    return c.body(null, 204);
  }
);
