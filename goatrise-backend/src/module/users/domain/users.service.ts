import { db } from "../../../core/db.js";
import { users, type UserRole } from "../schema/users.schema.js";
import { HTTPException } from "hono/http-exception";
import type { UpdateUserRequest } from "./validators.js";
import { eq } from "drizzle-orm";
import { ADMIN_EMAIL_LIST } from "../../../core/env.js";
import { normalizeVietnameseString } from "../../../core/utils.js";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { User } from "./types.js";

const adminEmails = ADMIN_EMAIL_LIST.split(",");

export async function getUserById(id: string): Promise<User> {
  const user = await db.query.users.findFirst({
    where: {
      id: id
    }
  });

  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return user;
}

export async function findUsers(
  search?: string,
  role?: UserRole,
  sort: string = "createdAt:DESC",
  offset: number = 0,
  limit: number = 20
): Promise<User[]> {
  const [sortField, sortDirection] = sort.split(":");
  const direction = sortDirection?.toLowerCase() === "asc" ? "asc" : "desc";

  return await db.query.users.findMany({
    where: {
      ...(search ? {
        OR: [
          { RAW: (t, { sql }) => sql`${t.id}::text ilike ${`%${search}%`}` },
          { normalizedFullName: { ilike: `%${normalizeVietnameseString(search)}%` } },
          { email: { ilike: `%${search}%` } },
          { phoneNum: { ilike: `%${search}%` } }
        ]
      } : {}),
      ...(role ? { role: role } : {})
    },
    offset: offset,
    limit: limit,
    orderBy: { [sortField]: direction }
  });
}

export async function updateUserInfo(
  actorId: string,
  userId: string,
  updateReq: UpdateUserRequest
): Promise<User> {
  await db.update(users).set({
    fullName: updateReq.fullName,
    normalizedFullName: updateReq.fullName ? normalizeVietnameseString(updateReq.fullName) : undefined,
    avtUrl: updateReq.avtUrl,
    phoneNum: updateReq.phoneNum
  }).where(eq(users.id, userId));

  return getUserById(userId);
}

export async function updateUserRole(
  actorId: string,
  userId: string,
  newRole: UserRole
): Promise<User> {
  const userBefore = await getUserById(userId);
  if (adminEmails.includes(userBefore.email)) {
    throw new HTTPException(409, { message: "Cannot change this user role" });
  }

  await db.update(users).set({
    role: newRole
  }).where(eq(users.id, userId));

  await recordAuditLog({
    actorId: actorId,
    code: "user-role-update",
    referenceType: "user",
    referenceId: userId,
    metadata: {
      oldRole: userBefore.role,
      newRole: newRole
    }
  });

  return getUserById(userId);
}