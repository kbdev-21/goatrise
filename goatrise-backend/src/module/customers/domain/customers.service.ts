import { db } from "../../../core/db.js";
import { customers } from "../schema/customers.schema.js";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { normalizeVietnameseString } from "../../../core/utils.js";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { CreateCustomerRequest, UpdateCustomerRequest } from "./validators.js";
import type { Customer } from "./types.js";

export async function getCustomerById(id: string): Promise<Customer> {
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

export async function createCustomer(actorId: string | null, createReq: CreateCustomerRequest): Promise<Customer> {
  const newCustomerId = uuidv7();
  await db.insert(customers).values({
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

  const newCustomer = await getCustomerById(newCustomerId);

  await recordAuditLog({
    actorId: actorId,
    code: "customer-create",
    referenceType: "customer",
    referenceId: newCustomerId,
    metadata: {
      customer: newCustomer
    }
  });

  return newCustomer;
}

export async function updateCustomer(actorId: string, customerId: string, updateReq: UpdateCustomerRequest): Promise<Customer> {
  const customerBefore = await getCustomerById(customerId);

  await db.update(customers).set({
    name: updateReq.name,
    normalizedName: updateReq.name ? normalizeVietnameseString(updateReq.name) : undefined,
    phoneNum: updateReq.phoneNum,
    socialMedias: updateReq.socialMedias,
    addresses: updateReq.addresses,
    note: updateReq.note,
    source: updateReq.source
  }).where(eq(customers.id, customerId));

  const customerAfter = await getCustomerById(customerId);

  await recordAuditLog({
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
}

export async function deleteCustomer(actorId: string, customerId: string): Promise<void> {
  const customerBefore = await getCustomerById(customerId);

  await db.delete(customers).where(eq(customers.id, customerId));

  await recordAuditLog({
    actorId: actorId,
    code: "customer-delete",
    referenceType: "customer",
    referenceId: customerId,
    metadata: {
      customer: customerBefore
    }
  });
}
