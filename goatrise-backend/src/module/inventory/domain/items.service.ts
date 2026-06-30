import { db } from "../../../core/db.js";
import { items } from "../schema/items.schema.js";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { normalizeVietnameseString } from "../../../core/utils.js";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import { checkIfItemsIsValidatedForProduct } from "../../catalog/domain/products.service.js";
import type { CreateItemRequest, UpdateItemRequest } from "./validators.js";
import { ITEM_RELATIONS, type Item } from "./types.js";

export async function getItemById(id: string): Promise<Item> {
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

export async function findAllItems(): Promise<Item[]> {
  return await db.query.items.findMany({
    orderBy: { createdAt: "desc" },
    with: ITEM_RELATIONS
  });
}

export async function createItem(actorId: string, createReq: CreateItemRequest): Promise<Item> {
  const newItemId = uuidv7();

  if (createReq.productId && !checkIfItemsIsValidatedForProduct([createReq.attributeValues ?? {}], createReq.productId)) {
    throw new HTTPException(409, { message: "Item attributes do not satisfy product's required attributes" });
  }

  await db.insert(items).values({
    id: newItemId,
    productId: createReq.productId ?? null,
    sku: createReq.sku,
    name: createReq.name,
    normalizedName: normalizeVietnameseString(createReq.name),
    note: createReq.note ?? null,
    imgUrl: createReq.imgUrl ?? null,
    weight: createReq.weight ?? null,
    price: createReq.price.toString(),
    attributeValues: createReq.attributeValues ?? null
  });

  const newItem = await getItemById(newItemId);

  await recordAuditLog({
    actorId: actorId,
    code: "item-create",
    referenceType: "item",
    referenceId: newItemId,
    metadata: {
      item: newItem
    }
  });

  return newItem;
}

export async function updateItemInfo(actorId: string, itemId: string, updateReq: UpdateItemRequest): Promise<Item> {
  const itemBefore = await getItemById(itemId);

  const effectiveProductId = updateReq.productId !== undefined ? updateReq.productId : itemBefore.productId;
  const effectiveAttrValues = updateReq.attributeValues !== undefined ? updateReq.attributeValues : itemBefore.attributeValues;
  if (
    (updateReq.productId !== undefined || updateReq.attributeValues !== undefined)
    && effectiveProductId
    && !checkIfItemsIsValidatedForProduct([effectiveAttrValues ?? {}], effectiveProductId)
  ) {
    throw new HTTPException(409, { message: "Item attributes do not satisfy product's required attributes" });
  }

  await db.update(items).set({
    productId: updateReq.productId,
    sku: updateReq.sku,
    name: updateReq.name,
    normalizedName: updateReq.name ? normalizeVietnameseString(updateReq.name) : undefined,
    note: updateReq.note,
    imgUrl: updateReq.imgUrl,
    weight: updateReq.weight,
    price: updateReq.price?.toString(),
    attributeValues: updateReq.attributeValues
  }).where(eq(items.id, itemId));

  const itemAfter = await getItemById(itemId);

  await recordAuditLog({
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
}

export async function deleteItem(actorId: string, itemId: string): Promise<void> {
  const itemBefore = await getItemById(itemId);

  // TODO: chỉ cho phép delete nếu ko có product/variant nào link vào item, nếu có thì throw 409

  await db.delete(items).where(eq(items.id, itemId));

  await recordAuditLog({
    actorId: actorId,
    code: "item-delete",
    referenceType: "item",
    referenceId: itemId,
    metadata: {
      item: itemBefore
    }
  });
}
