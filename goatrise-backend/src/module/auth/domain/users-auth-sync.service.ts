import { uuidv7 } from "uuidv7";
import { eq } from "drizzle-orm";
import type { DbExec } from "../../../core/db.js";
import { users } from "../schema/users.schema.js";
import { getUserById } from "./users.service.js";
import { ADMIN_EMAIL_LIST } from "../../../core/env.js";
import { normalizeVietnameseString } from "../../../core/utils.js";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { User } from "./types.js";

const adminEmails = ADMIN_EMAIL_LIST.split(",");

export async function syncUserWithGoogleAuthData(db: DbExec, email: string, fullName: string, avtUrl: string | null): Promise<User> {
  const existedUser = await db.query.users.findFirst({
    where: {
      email: email
    }
  });

  const isAdmin = adminEmails.includes(email);

  if (existedUser) {
    const shouldPromoteToAdmin = isAdmin && existedUser.role !== "ADMIN";
    const shouldFillAvtUrl = !existedUser.avtUrl && !!avtUrl;

    if (!shouldPromoteToAdmin && !shouldFillAvtUrl) {
      return existedUser;
    }

    await db.update(users).set({
      role: shouldPromoteToAdmin ? "ADMIN" : undefined,
      avtUrl: shouldFillAvtUrl ? avtUrl : undefined
    }).where(eq(users.id, existedUser.id));

    return await getUserById(db, existedUser.id);
  }

  const newUserId = uuidv7();
  const role = isAdmin ? "ADMIN" : "CUSTOMER";

  return await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: newUserId,
      role: role,
      email: email,
      fullName: fullName,
      normalizedFullName: normalizeVietnameseString(fullName),
      avtUrl: avtUrl,
      phoneNum: null
    });

    const newUser = await getUserById(tx, newUserId);

    await recordAuditLog(tx, {
      actorId: newUserId,
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