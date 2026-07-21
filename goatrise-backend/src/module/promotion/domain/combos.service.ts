import type { DbExec } from "../../../core/db.js";
import { combos } from "../schema/combos.schema.js";
import { HTTPException } from "hono/http-exception";
import { eq, inArray, sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { CreateComboRequest, UpdateComboRequest } from "./validators.js";
import type { Combo } from "./types.js";

export async function getComboById(db: DbExec, id: string): Promise<Combo> {
  const combo = await db.query.combos.findFirst({
    where: {
      id: id
    }
  });

  if (!combo) {
    throw new HTTPException(404, { message: "Combo not found" });
  }

  return combo;
}

export async function findCombos(db: DbExec): Promise<Combo[]> {
  return await db.query.combos.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function createCombo(db: DbExec, actorId: string, createReq: CreateComboRequest): Promise<Combo> {
  const newComboId = uuidv7();

  return await db.transaction(async (tx) => {
    await tx.insert(combos).values({
      id: newComboId,
      code: createReq.code,
      description: createReq.description ?? null,
      andConditions: createReq.andConditions,
      discountType: createReq.discountType,
      discountValue: createReq.discountValue,
      isActive: createReq.isActive
    });

    const newCombo = await getComboById(tx, newComboId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "combo-create",
      referenceType: "combo",
      referenceId: newComboId,
      metadata: {
        combo: newCombo
      }
    });

    return newCombo;
  });
}

export async function updateCombo(db: DbExec, actorId: string, comboId: string, updateReq: UpdateComboRequest): Promise<Combo> {
  return await db.transaction(async (tx) => {
    const comboBefore = await getComboById(tx, comboId);

    await tx.update(combos).set({
      code: updateReq.code,
      description: updateReq.description,
      andConditions: updateReq.andConditions,
      discountType: updateReq.discountType,
      discountValue: updateReq.discountValue,
      isActive: updateReq.isActive
    }).where(eq(combos.id, comboId));

    const comboAfter = await getComboById(tx, comboId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "combo-update",
      referenceType: "combo",
      referenceId: comboId,
      metadata: {
        before: comboBefore,
        after: comboAfter
      }
    });

    return comboAfter;
  });
}

// +1 usedCount cho từng combo đã áp vào đơn (gọi khi đơn hoàn tất). Dùng sql increment để
// tránh lost-update khi nhiều đơn hoàn tất cùng lúc.
export async function incrementCombosUsage(db: DbExec, comboIds: string[]): Promise<void> {
  if (comboIds.length === 0) {
    return;
  }

  await db.update(combos)
    .set({ usedCount: sql`${combos.usedCount} + 1` })
    .where(inArray(combos.id, comboIds));
}

export async function deleteCombo(db: DbExec, actorId: string, comboId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const comboBefore = await getComboById(tx, comboId);

    await tx.delete(combos).where(eq(combos.id, comboId));

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "combo-delete",
      referenceType: "combo",
      referenceId: comboId,
      metadata: {
        combo: comboBefore
      }
    });
  });
}
