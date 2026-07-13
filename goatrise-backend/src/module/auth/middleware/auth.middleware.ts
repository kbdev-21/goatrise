import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../../core/auth.js";
import { db } from "../../../core/db.js";
import { syncUserWithGoogleAuthData } from "../domain/users-auth-sync.service.js";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  if (!authHeader.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  const authUser = await auth.getUser(token);
  if (authUser.error || !authUser.data.user || !authUser.data.user.email) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const email = authUser.data.user.email;
  const fullName: string = authUser.data.user.user_metadata.full_name ?? authUser.data.user.user_metadata.name ?? "";
  const avtUrl: string | null = authUser.data.user.user_metadata.avt_url ?? authUser.data.user.user_metadata.picture ?? null;

  try {
    const currentUser = await syncUserWithGoogleAuthData(db, email, fullName, avtUrl);
    c.set("currentUser", currentUser);
  } catch (e) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  await next();
});