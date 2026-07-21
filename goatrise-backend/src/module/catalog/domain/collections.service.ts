import type { DbExec } from "../../../core/db.js";
import { collections } from "../schema/collections.schema.js";
import { collectionProducts } from "../schema/collection-products.schema.js";
import { products } from "../schema/products.schema.js";
import { HTTPException } from "hono/http-exception";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { CreateCollectionRequest, UpdateCollectionRequest } from "./validators.js";
import { COLLECTION_RELATIONS, type Collection } from "./types.js";

export async function getCollectionById(db: DbExec, id: string): Promise<Collection> {
  const collection = await db.query.collections.findFirst({
    where: {
      id: id
    },
    with: COLLECTION_RELATIONS
  });

  if (!collection) {
    throw new HTTPException(404, { message: "Collection not found" });
  }

  return collection;
}

export async function getCollectionBySlug(db: DbExec, slug: string): Promise<Collection> {
  const collection = await db.query.collections.findFirst({
    where: {
      slug: slug
    },
    with: COLLECTION_RELATIONS
  });

  if (!collection) {
    throw new HTTPException(404, { message: "Collection not found" });
  }

  return collection;
}

export async function findAllCollections(db: DbExec): Promise<Collection[]> {
  return await db.query.collections.findMany({
    orderBy: { createdAt: "desc" },
    with: COLLECTION_RELATIONS
  });
}

export async function createCollection(db: DbExec, actorId: string, createReq: CreateCollectionRequest): Promise<Collection> {
  const newCollectionId = uuidv7();

  return await db.transaction(async (tx) => {
    if (createReq.productIds?.length) {
      await validateProductIds(tx, createReq.productIds);
    }

    await tx.insert(collections).values({
      id: newCollectionId,
      slug: createReq.slug,
      type: createReq.type,
      title: createReq.title,
      shortDescription: createReq.shortDescription,
      imgUrl: createReq.imgUrl ?? null,
      isActive: createReq.isActive,
      priority: createReq.priority
    });

    if (createReq.productIds?.length) {
      await tx.insert(collectionProducts).values(createReq.productIds.map((productId) => ({
        id: uuidv7(),
        collectionId: newCollectionId,
        productId: productId,
        isFeatured: false
      })));
    }

    const newCollection = await getCollectionById(tx, newCollectionId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "collection-create",
      referenceType: "collection",
      referenceId: newCollectionId,
      metadata: {
        collection: newCollection
      }
    });

    return newCollection;
  });
}

export async function updateCollection(db: DbExec, actorId: string, collectionId: string, updateReq: UpdateCollectionRequest): Promise<Collection> {
  return await db.transaction(async (tx) => {
    const collectionBefore = await getCollectionById(tx, collectionId);

    if (updateReq.productIds !== undefined) {
      await validateProductIds(tx, updateReq.productIds);
    }

    await tx.update(collections).set({
      slug: updateReq.slug,
      type: updateReq.type,
      title: updateReq.title,
      shortDescription: updateReq.shortDescription,
      imgUrl: updateReq.imgUrl,
      isActive: updateReq.isActive,
      priority: updateReq.priority
    }).where(eq(collections.id, collectionId));

    if (updateReq.productIds !== undefined) {
      await reconcileCollectionProducts(tx, collectionId, updateReq.productIds);
    }

    const collectionAfter = await getCollectionById(tx, collectionId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "collection-update",
      referenceType: "collection",
      referenceId: collectionId,
      metadata: {
        before: collectionBefore,
        after: collectionAfter
      }
    });

    return collectionAfter;
  });
}

export async function deleteCollection(db: DbExec, actorId: string, collectionId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const collectionBefore = await getCollectionById(tx, collectionId);

    await tx.delete(collectionProducts).where(eq(collectionProducts.collectionId, collectionId));
    await tx.delete(collections).where(eq(collections.id, collectionId));

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "collection-delete",
      referenceType: "collection",
      referenceId: collectionId,
      metadata: {
        collection: collectionBefore
      }
    });
  });
}

async function validateProductIds(db: DbExec, productIds: string[]): Promise<void> {
  if (productIds.length === 0) {
    return;
  }

  const rows = await db.select({ id: products.id }).from(products).where(inArray(products.id, productIds));

  if (rows.length !== productIds.length) {
    throw new HTTPException(409, { message: "Some products do not exist" });
  }
}

async function reconcileCollectionProducts(tx: DbExec, collectionId: string, productIds: string[]): Promise<void> {
  if (productIds.length === 0) {
    await tx.delete(collectionProducts).where(eq(collectionProducts.collectionId, collectionId));
    return;
  }

  await tx.delete(collectionProducts).where(and(eq(collectionProducts.collectionId, collectionId), notInArray(collectionProducts.productId, productIds)));

  const existing = await tx.select({ productId: collectionProducts.productId }).from(collectionProducts).where(eq(collectionProducts.collectionId, collectionId));
  const existingIds = new Set(existing.map((row) => row.productId));
  const toInsert = productIds.filter((productId) => !existingIds.has(productId));

  if (toInsert.length > 0) {
    await tx.insert(collectionProducts).values(toInsert.map((productId) => ({
      id: uuidv7(),
      collectionId: collectionId,
      productId: productId,
      isFeatured: false
    })));
  }
}
