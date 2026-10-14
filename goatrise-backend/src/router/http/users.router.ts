import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requiredRolesMiddleware } from "../middlewares/required-roles.middleware.js";
import type { ContextVariables } from "../../core/types.js";
import { db } from "../../db/db.js";
import { createUser, findUsers, updateUserInfo, updateUserRole } from "../../domain/auth/users.service.js";
import { findCustomerByEmail } from "../../domain/customers/customers.service.js";
import type { UserDetail } from "../../domain/auth/types.js";
import { zValidator } from "@hono/zod-validator";
import { CreateUserRequestSchema, UpdateUserRequestSchema, UpdateUserRoleRequestSchema, FindUsersQuerySchema } from "../../domain/auth/validators.js";

export const usersRouter = new Hono<{ Variables: ContextVariables }>();

usersRouter.get("/api/users/me",
  authMiddleware,
  async (c) => {
    const currentUser = c.get("currentUser");
    const customer = await findCustomerByEmail(db, currentUser.email);
    const userDetail: UserDetail = { ...currentUser, customer: customer };
    return c.json(userDetail);
  }
);

usersRouter.get("/api/users",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", FindUsersQuerySchema),
  async (c) => {
    const query = c.req.valid("query");

    const users = await findUsers(db, query);

    return c.json(users);
  }
);

usersRouter.post("/api/users",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN"]),
  zValidator("json", CreateUserRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const createReq = c.req.valid("json");

    const newUser = await createUser(db, currentUser.id, createReq);

    return c.json(newUser, 201);
  }
);

usersRouter.patch("/api/users/me",
  authMiddleware,
  zValidator("json", UpdateUserRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const updateReq = c.req.valid("json");

    const updatedUser = await updateUserInfo(db, currentUser.id, currentUser.id, updateReq);

    return c.json(updatedUser);
  }
);

usersRouter.post("/api/users/:userId/update-role",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN"]),
  zValidator("json", UpdateUserRoleRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const userId = c.req.param("userId");
    const { role } = c.req.valid("json");

    const updatedUser = await updateUserRole(db, currentUser.id, userId, role);

    return c.json(updatedUser);
  }
);