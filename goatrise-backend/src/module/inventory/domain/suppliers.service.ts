import type { DbExec } from "../../../core/db.js";
import { suppliers } from "../schema/suppliers.schema.js";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { CreateSupplierRequest, UpdateSupplierRequest } from "./validators.js";
import type { Supplier } from "./types.js";

export async function getSupplierById(db: DbExec, id: string): Promise<Supplier> {
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

export async function findAllSuppliers(db: DbExec): Promise<Supplier[]> {
  return await db.query.suppliers.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function createSupplier(db: DbExec, actorId: string, createReq: CreateSupplierRequest): Promise<Supplier> {
  const newSupplierId = uuidv7();

  return await db.transaction(async (tx) => {
    await tx.insert(suppliers).values({
      id: newSupplierId,
      name: createReq.name,
      note: createReq.note ?? null
    });

    const newSupplier = await getSupplierById(tx, newSupplierId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "supplier-create",
      referenceType: "supplier",
      referenceId: newSupplierId,
      metadata: {
        supplier: newSupplier
      }
    });

    return newSupplier;
  });
}

export async function updateSupplier(db: DbExec, actorId: string, supplierId: string, updateReq: UpdateSupplierRequest): Promise<Supplier> {
  return await db.transaction(async (tx) => {
    const supplierBefore = await getSupplierById(tx, supplierId);

    await tx.update(suppliers).set({
      name: updateReq.name,
      note: updateReq.note
    }).where(eq(suppliers.id, supplierId));

    const supplierAfter = await getSupplierById(tx, supplierId);

    await recordAuditLog(tx, {
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
  });
}

export async function deleteSupplier(db: DbExec, actorId: string, supplierId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const supplierBefore = await getSupplierById(tx, supplierId);

    await tx.delete(suppliers).where(eq(suppliers.id, supplierId));

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "supplier-delete",
      referenceType: "supplier",
      referenceId: supplierId,
      metadata: {
        supplier: supplierBefore
      }
    });
  });
}
