import type { DbExec } from "../../../core/db.js";
import { items, type ItemAttributeValues } from "../schema/items.schema.js";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { normalizeVietnameseString } from "../../../core/utils.js";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { CreateItemRequest, UpdateItemRequest } from "./validators.js";
import { ITEM_RELATIONS, type Item } from "./types.js";
import { areAttributeValuesValidForRequired, getProductById } from "../../catalog/domain/products.service.js";

export async function getItemById(db: DbExec, id: string): Promise<Item> {
  const item = await db.query.items.findFirst({
    where: {
      id: id
    },
    with: ITEM_RELATIONS
  });

  if (!item) {
    throw new HTTPException(404, { message: "Item not found" });
  }

  return item;
}

export async function findAllItems(db: DbExec): Promise<Item[]> {
  return await db.query.items.findMany({
    orderBy: { createdAt: "desc" },
    with: ITEM_RELATIONS
  });
}

export async function createItem(db: DbExec, actorId: string, createReq: CreateItemRequest): Promise<Item> {
  const newItemId = uuidv7();

  return await db.transaction(async (tx) => {
    if(createReq.productId) {
      await validateProductIdWhenCreateOrUpdateItem(tx, createReq.productId, createReq.attributeValues);
    }

    await tx.insert(items).values({
      id: newItemId,
      productId: createReq.productId ?? null,
      sku: createReq.sku,
      name: createReq.name,
      normalizedName: normalizeVietnameseString(createReq.name),
      note: createReq.note ?? null,
      imgUrl: createReq.imgUrl ?? null,
      weight: createReq.weight ?? null,
      price: createReq.price,
      displayPriority: createReq.displayPriority,
      isActive: createReq.isActive,
      attributeValues: createReq.attributeValues
    });

    const newItem = await getItemById(tx, newItemId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "item-create",
      referenceType: "item",
      referenceId: newItemId,
      metadata: {
        item: newItem
      }
    });

    return newItem;
  });
}

export async function updateItemInfo(db: DbExec, actorId: string, itemId: string, updateReq: UpdateItemRequest): Promise<Item> {
  return await db.transaction(async (tx) => {
    const itemBefore = await getItemById(tx, itemId);

    if(updateReq.productId) {
      await validateProductIdWhenCreateOrUpdateItem(tx, updateReq.productId, updateReq.attributeValues ?? itemBefore.attributeValues, itemId);
    }

    await tx.update(items).set({
      productId: updateReq.productId,
      sku: updateReq.sku,
      name: updateReq.name,
      normalizedName: updateReq.name ? normalizeVietnameseString(updateReq.name) : undefined,
      note: updateReq.note,
      imgUrl: updateReq.imgUrl,
      weight: updateReq.weight,
      price: updateReq.price,
      displayPriority: updateReq.displayPriority,
      isActive: updateReq.isActive,
      attributeValues: updateReq.attributeValues
    }).where(eq(items.id, itemId));

    const itemAfter = await getItemById(tx, itemId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "item-update",
      referenceType: "item",
      referenceId: itemId,
      metadata: {
        before: itemBefore,
        after: itemAfter
      }
    });

    return itemAfter;
  });
}

export async function deleteItem(db: DbExec, actorId: string, itemId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const itemBefore = await getItemById(tx, itemId);

    // TODO: chỉ cho phép delete nếu chưa có order nào, nếu có rồi thì throw 409

    await tx.delete(items).where(eq(items.id, itemId));

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "item-delete",
      referenceType: "item",
      referenceId: itemId,
      metadata: {
        item: itemBefore
      }
    });
  });
}

async function validateProductIdWhenCreateOrUpdateItem(db: DbExec, productId: string, itemAttributeValues: ItemAttributeValues, itemId?: string): Promise<void> {
  const product = await getProductById(db, productId);

  const itemsAttrValuesList = product.items
    .filter((item) => item.id !== itemId)
    .map((item) => item.attributeValues);
  const productRequiredAttrs = product.requiredAttributes;

  itemsAttrValuesList.push(itemAttributeValues);

  if(!areAttributeValuesValidForRequired(itemsAttrValuesList, productRequiredAttrs)) {
    throw new HTTPException(409, { message: "Linked items do not satisfy product's required attributes" });
  }
}