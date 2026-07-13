import type { DbExec } from "../../../core/db.js";
import { customers } from "../schema/customers.schema.js";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { normalizeVietnameseString } from "../../../core/utils.js";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { CreateCustomerRequest, UpdateCustomerRequest } from "./validators.js";
import type { Customer } from "./types.js";

export async function getCustomerById(db: DbExec, id: string): Promise<Customer> {
  const customer = await db.query.customers.findFirst({
    where: {
      id: id
    }
  });

  if (!customer) {
    throw new HTTPException(404, { message: "Customer not found" });
  }

  return customer;
}

export async function findCustomers(
  db: DbExec,
  search?: string,
  sort: string = "createdAt:DESC",
  offset: number = 0,
  limit: number = 20
): Promise<Customer[]> {
  const [sortField, sortDirection] = sort.split(":");
  const direction: "asc" | "desc" = sortDirection?.toLowerCase() === "asc" ? "asc" : "desc";

  return await db.query.customers.findMany({
    where: {
      ...(search ? {
        OR: [
          { email: { ilike: `%${search}%` } },
          { phoneNum: { ilike: `%${search}%` } },
          { normalizedName: { ilike: `%${normalizeVietnameseString(search)}%` } }
        ]
      } : {})
    },
    offset: offset,
    limit: limit,
    orderBy: { [sortField]: direction }
  });
}

export async function createCustomer(db: DbExec, actorId: string | null, createReq: CreateCustomerRequest): Promise<Customer> {
  const newCustomerId = uuidv7();

  return await db.transaction(async (tx) => {
    await tx.insert(customers).values({
      id: newCustomerId,
      name: createReq.name,
      normalizedName: normalizeVietnameseString(createReq.name),
      email: createReq.email ?? null,
      phoneNum: createReq.phoneNum ?? null,
      socialMedias: createReq.socialMedias,
      addresses: createReq.addresses,
      note: createReq.note ?? null,
      source: createReq.source
    });

    const newCustomer = await getCustomerById(tx, newCustomerId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "customer-create",
      referenceType: "customer",
      referenceId: newCustomerId,
      metadata: {
        customer: newCustomer
      }
    });

    return newCustomer;
  });
}

export async function updateCustomer(db: DbExec, actorId: string, customerId: string, updateReq: UpdateCustomerRequest): Promise<Customer> {
  return await db.transaction(async (tx) => {
    const customerBefore = await getCustomerById(tx, customerId);

    await tx.update(customers).set({
      name: updateReq.name,
      normalizedName: updateReq.name ? normalizeVietnameseString(updateReq.name) : undefined,
      phoneNum: updateReq.phoneNum,
      socialMedias: updateReq.socialMedias,
      addresses: updateReq.addresses,
      note: updateReq.note,
      source: updateReq.source
    }).where(eq(customers.id, customerId));

    const customerAfter = await getCustomerById(tx, customerId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "customer-update",
      referenceType: "customer",
      referenceId: customerId,
      metadata: {
        before: customerBefore,
        after: customerAfter
      }
    });

    return customerAfter;
  });
}

export async function deleteCustomer(db: DbExec, actorId: string, customerId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const customerBefore = await getCustomerById(tx, customerId);

    await tx.delete(customers).where(eq(customers.id, customerId));

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "customer-delete",
      referenceType: "customer",
      referenceId: customerId,
      metadata: {
        customer: customerBefore
      }
    });
  });
}
