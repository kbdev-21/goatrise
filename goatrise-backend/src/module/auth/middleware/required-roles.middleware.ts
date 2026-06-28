import { createMiddleware } from "hono/factory";
import type { UserRole } from "../../users/schema/users.schema.js";
import { HTTPException } from "hono/http-exception";
import type { User } from "../../users/domain/types.js";

export const requiredRolesMiddleware = (requiredRoles: UserRole[]) => createMiddleware(async (c, next) => {
  const currentUser: User | null = c.get("currentUser");
  if (!currentUser) {
    throw new Error("requiredRolesMiddleware used without/before authMiddleware");
  }

  if (!requiredRoles.includes(currentUser.role)) {
    throw new HTTPException(403, { message: "Not allowed" });
  }

  await next();
});