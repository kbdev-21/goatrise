import type { DbExec } from "../../db/db.js";
import { customers } from "../../db/schema/customers.schema.js";
import { eq } from "drizzle-orm";
import { createCustomer, findCustomerByEmail, updateCustomer } from "./customers.service.js";
import type { SalesChannel } from "../../core/types.js";
import type { Customer } from "./types.js";
import type { UpdateMyCustomerRequest } from "./validators.js";

export async function getOrCreateOrSyncCustomer(db: DbExec, name: string, email?: string, phoneNum?: string, source?: SalesChannel): Promise<Customer> {
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
    return await syncMissingFields(db, existing, email, phoneNum);
  }

  // chưa có -> tạo mới (actorId null: luồng sync ko gắn với actor cụ thể).
  // 2 request cùng email chạy song song: INSERT sau vỡ unique(email) -> đọc lại bản kia vừa tạo.
  try {
    return await createCustomer(db, null, { name: name, email: email, phoneNum: phoneNum, source: source });
  } catch (e) {
    if (!email || !isUniqueViolation(e)) {
      throw e;
    }

    const raced = await db.query.customers.findFirst({ where: { email: email } });
    if (!raced) {
      throw e;
    }

    return await syncMissingFields(db, raced, email, phoneNum);
  }
}

// user tự cập nhật thông tin mua hàng: có customer trùng email thì update, chưa có thì tạo mới.
// chỉ tìm theo email (KHÔNG claim theo SĐT: SĐT user tự khai, chưa xác thực).
// gọi NGOÀI transaction: nhánh tạo mới bắt unique-violation (2 request song song) rồi update bản kia.
export async function upsertCustomerByEmail(
  db: DbExec,
  actorId: string,
  email: string,
  fallbackName: string,
  updateReq: UpdateMyCustomerRequest
): Promise<Customer> {
  const existing = await findCustomerByEmail(db, email);
  if (existing) {
    return await updateCustomer(db, actorId, existing.id, updateReq);
  }

  try {
    return await createCustomer(db, actorId, {
      name: updateReq.name ?? fallbackName,
      email: email,
      phoneNum: updateReq.phoneNum,
      addresses: updateReq.addresses,
      source: "WEBSITE"
    });
  } catch (e) {
    if (!isUniqueViolation(e)) {
      throw e;
    }

    const raced = await findCustomerByEmail(db, email);
    if (!raced) {
      throw e;
    }

    return await updateCustomer(db, actorId, raced.id, updateReq);
  }
}

async function syncMissingFields(db: DbExec, existing: Customer, email?: string, phoneNum?: string): Promise<Customer> {
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
