import type { DbExec } from "../../../core/db.js";
import { users, type UserRole } from "../schema/users.schema.js";
import { HTTPException } from "hono/http-exception";
import type { CreateUserRequest, UpdateUserRequest } from "./validators.js";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { ADMIN_EMAIL_LIST } from "../../../core/env.js";
import { normalizeVietnameseString } from "../../../core/utils.js";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { User } from "./types.js";

const adminEmails = ADMIN_EMAIL_LIST.split(",");

export async function getUserById(db: DbExec, id: string): Promise<User> {
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
  db: DbExec,
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

export async function createUser(
  db: DbExec,
  actorId: string,
  createReq: CreateUserRequest
): Promise<User> {
  return await db.transaction(async (tx) => {
    const existedUser = await tx.query.users.findFirst({
      where: {
        email: createReq.email
      }
    });

    if (existedUser) {
      throw new HTTPException(409, { message: "Email already in use" });
    }

    const newUserId = uuidv7();
    await tx.insert(users).values({
      id: newUserId,
      role: createReq.role,
      email: createReq.email,
      fullName: createReq.fullName,
      normalizedFullName: normalizeVietnameseString(createReq.fullName),
      phoneNum: createReq.phoneNum ?? null,
      avtUrl: createReq.avtUrl ?? null
    });

    const newUser = await getUserById(tx, newUserId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "user-create",
      referenceType: "user",
      referenceId: newUserId,
      metadata: {
        user: newUser
      }
    });

    return newUser;
  });
}

export async function updateUserInfo(
  db: DbExec,
  actorId: string,
  userId: string,
  updateReq: UpdateUserRequest
): Promise<User> {
  return await db.transaction(async (tx) => {
    await tx.update(users).set({
      fullName: updateReq.fullName,
      normalizedFullName: updateReq.fullName ? normalizeVietnameseString(updateReq.fullName) : undefined,
      avtUrl: updateReq.avtUrl,
      phoneNum: updateReq.phoneNum
    }).where(eq(users.id, userId));

    return await getUserById(tx, userId);
  });
}

export async function updateUserRole(
  db: DbExec,
  actorId: string,
  userId: string,
  newRole: UserRole
): Promise<User> {
  return await db.transaction(async (tx) => {
    const userBefore = await getUserById(tx, userId);
    if (adminEmails.includes(userBefore.email)) {
      throw new HTTPException(409, { message: "Cannot change this user role" });
    }

    await tx.update(users).set({
      role: newRole
    }).where(eq(users.id, userId));

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "user-role-update",
      referenceType: "user",
      referenceId: userId,
      metadata: {
        oldRole: userBefore.role,
        newRole: newRole
      }
    });

    return await getUserById(tx, userId);
  });
}