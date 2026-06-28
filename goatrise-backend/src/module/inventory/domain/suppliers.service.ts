import { db } from "../../../core/db.js";
import { suppliers } from "../schema/suppliers.schema.js";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { CreateSupplierRequest, UpdateSupplierRequest } from "./validators.js";
import type { Supplier } from "./types.js";

export async function getSupplierById(id: string): Promise<Supplier> {
  const supplier = await db.query.suppliers.findFirst({
    where: {
      id: id
    }
  });

  if (!supplier) {
    throw new HTTPException(404, { message: "Supplier not found" });
  }

  return supplier;
}

export async function findAllSuppliers(): Promise<Supplier[]> {
  return await db.query.suppliers.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function createSupplier(actorId: string, createReq: CreateSupplierRequest): Promise<Supplier> {
  const newSupplierId = uuidv7();

  await db.insert(suppliers).values({
    id: newSupplierId,
    name: createReq.name,
    note: createReq.note ?? null
  });

  const newSupplier = await getSupplierById(newSupplierId);

  await recordAuditLog({
    actorId: actorId,
    code: "supplier-create",
    referenceType: "supplier",
    referenceId: newSupplierId,
    metadata: {
      supplier: newSupplier
    }
  });

  return newSupplier;
}

export async function updateSupplier(actorId: string, supplierId: string, updateReq: UpdateSupplierRequest): Promise<Supplier> {
  const supplierBefore = await getSupplierById(supplierId);

  await db.update(suppliers).set({
    name: updateReq.name,
    note: updateReq.note
  }).where(eq(suppliers.id, supplierId));

  const supplierAfter = await getSupplierById(supplierId);

  await recordAuditLog({
    actorId: actorId,
    code: "supplier-update",
    referenceType: "supplier",
    referenceId: supplierId,
    metadata: {
      before: supplierBefore,
      after: supplierAfter
    }
  });

  return supplierAfter;
}

export async function deleteSupplier(actorId: string, supplierId: string): Promise<void> {
  const supplierBefore = await getSupplierById(supplierId);

  const linkedTransaction = await db.query.itemTransactions.findFirst({
    where: {
      supplierId: supplierId
    }
  });

  if (linkedTransaction) {
    throw new HTTPException(409, { message: "Cannot delete supplier with linked items" });
  }

  await db.delete(suppliers).where(eq(suppliers.id, supplierId));

  await recordAuditLog({
    actorId: actorId,
    code: "supplier-delete",
    referenceType: "supplier",
    referenceId: supplierId,
    metadata: {
      supplier: supplierBefore
    }
  });
}
