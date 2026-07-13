import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { db } from "../../../core/db.js";
import { createUser, findUsers, updateUserInfo, updateUserRole } from "../domain/users.service.js";
import { zValidator } from "@hono/zod-validator";
import { CreateUserRequestSchema, UpdateUserRequestSchema, UpdateUserRoleRequestSchema } from "../domain/validators.js";
import type { UserRole } from "../schema/users.schema.js";

export const usersRouter = new Hono<{ Variables: ContextVariables }>();

usersRouter.get("/api/users/me",
  authMiddleware,
  (c) => {
    const currentUser = c.get("currentUser");
    return c.json(currentUser);
  }
);

usersRouter.get("/api/users",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const {
      search,
      role,
      sort,
      offset,
      limit,
    } = c.req.query();

    const users = await findUsers(
      db,
      search,
      role ? (role as UserRole) : undefined,
      sort || undefined,
      offset ? Number(offset) : undefined,
      limit ? Number(limit) : undefined
    );

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