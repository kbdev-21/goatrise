import { uuidv7 } from "uuidv7";
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

  if (existedUser) {
    return existedUser;
  }

  const newUserId = uuidv7();
  const isAdmin = adminEmails.includes(email);
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