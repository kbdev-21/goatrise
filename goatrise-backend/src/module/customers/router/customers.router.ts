import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { createCustomer, deleteCustomer, findCustomers, updateCustomer } from "../domain/customers.service.js";
import { zValidator } from "@hono/zod-validator";
import { CreateCustomerRequestSchema, UpdateCustomerRequestSchema } from "../domain/validators.js";

export const customersRouter = new Hono<{ Variables: ContextVariables }>();

customersRouter.get("/api/customers",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const {
      search,
      sort,
      offset,
      limit,
    } = c.req.query();

    const customers = await findCustomers(
      search,
      sort || undefined,
      offset ? Number(offset) : undefined,
      limit ? Number(limit) : undefined
    );

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

    const newCustomer = await createCustomer(currentUser.id, createReq);

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

    const updatedCustomer = await updateCustomer(currentUser.id, customerId, updateReq);

    return c.json(updatedCustomer);
  }
);

customersRouter.delete("/api/customers/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const currentUser = c.get("currentUser");
    const customerId = c.req.param("id");

    await deleteCustomer(currentUser.id, customerId);

    return c.body(null, 204);
  }
);
