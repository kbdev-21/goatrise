import { db } from "../../../core/db.js";
import { customers } from "../schema/customers.schema.js";
import { eq } from "drizzle-orm";
import { createCustomer } from "./customers.service.js";
import type { Customer } from "./types.js";

export async function getOrCreateOrSyncCustomer(name: string, email?: string, phoneNum?: string): Promise<Customer> {
  // ưu tiên tìm theo email
  let existing = email
    ? await db.query.customers.findFirst({ where: { email: email } })
    : undefined;

  // chưa thấy theo email nhưng có phoneNum -> tìm theo phoneNum
  if (!existing && phoneNum) {
    existing = await db.query.customers.findFirst({ where: { phoneNum: phoneNum } });
  }

  // đã có customer -> sync (chỉ điền field còn thiếu), rồi return
  if (existing) {
    return await syncMissingFields(existing, email, phoneNum);
  }

  // chưa có -> tạo mới (actorId null: luồng sync ko gắn với actor cụ thể)
  return await createCustomer(null, { name: name, email: email, phoneNum: phoneNum });
}

async function syncMissingFields(existing: Customer, email?: string, phoneNum?: string): Promise<Customer> {
  const updates: Partial<Pick<Customer, "email" | "phoneNum">> = {};

  if (email && !existing.email) {
    updates.email = email;
  }
  if (phoneNum && !existing.phoneNum) {
    updates.phoneNum = phoneNum;
  }

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const [updated] = await db
    .update(customers)
    .set(updates)
    .where(eq(customers.id, existing.id))
    .returning();

  return updated;
}
