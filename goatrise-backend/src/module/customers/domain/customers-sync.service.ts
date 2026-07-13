import { db } from "../../../core/db.js";
import { customers } from "../schema/customers.schema.js";
import { eq } from "drizzle-orm";
import { createCustomer } from "./customers.service.js";
import type { Customer } from "./types.js";

export async function getOrCreateOrSyncCustomer(name: string, email?: string, phoneNum?: string): Promise<Customer> {
  // email là identity ưu tiên.
  let existing: Customer | undefined;
  if (email) {
    existing = await db.query.customers.findFirst({ where: { email: email } });

    // email chưa tồn tại: nếu có customer trùng phone mà CHƯA có email -> claim (ghi đè email lên đó).
    // nếu customer trùng phone đã có email rồi -> để undefined để tạo customer mới.
    if (!existing && phoneNum) {
      const byPhone = await db.query.customers.findFirst({ where: { phoneNum: phoneNum } });
      if (byPhone && !byPhone.email) {
        existing = byPhone;
      }
    }
  } else if (phoneNum) {
    existing = await db.query.customers.findFirst({ where: { phoneNum: phoneNum } });
  }

  // đã có customer -> sync (chỉ điền field còn thiếu), rồi return
  if (existing) {
    return await syncMissingFields(existing, email, phoneNum);
  }

  // chưa có -> tạo mới (actorId null: luồng sync ko gắn với actor cụ thể).
  // 2 request cùng email chạy song song: INSERT sau vỡ unique(email) -> đọc lại bản kia vừa tạo.
  try {
    return await createCustomer(null, { name: name, email: email, phoneNum: phoneNum });
  } catch (e) {
    if (!email || !isUniqueViolation(e)) {
      throw e;
    }

    const raced = await db.query.customers.findFirst({ where: { email: email } });
    if (!raced) {
      throw e;
    }

    return await syncMissingFields(raced, email, phoneNum);
  }
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

function isUniqueViolation(e: unknown): boolean {
  // Postgres unique_violation = 23505; drizzle bọc lỗi gốc ở .cause
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
}
