import { db } from "../../../core/db.js";
import { products } from "../schema/products.schema.js";
import { items } from "../../inventory/schema/items.schema.js";
import { HTTPException } from "hono/http-exception";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import type { ItemAttribute, ItemAttributeValues } from "../../inventory/schema/items.schema.js";
import type { CreateProductRequest, UpdateProductRequest } from "./validators.js";
import { PRODUCT_LIGHT_RELATIONS, PRODUCT_RELATIONS, type Product, type ProductDetail } from "./types.js";

export async function getProductById(id: string): Promise<Product> {
  const product = await db.query.products.findFirst({
    where: {
      id: id
    },
    with: PRODUCT_LIGHT_RELATIONS
  });

  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  return product;
}

export async function getProductDetailById(id: string): Promise<ProductDetail> {
  const product = await db.query.products.findFirst({
    where: {
      id: id
    },
    with: PRODUCT_RELATIONS
  });

  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  return product;
}

export async function getProductDetailBySlug(slug: string): Promise<ProductDetail> {
  const product = await db.query.products.findFirst({
    where: {
      slug: slug
    },
    with: PRODUCT_RELATIONS
  });

  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  return product;
}

export async function findAllProducts(): Promise<Product[]> {
  return await db.query.products.findMany({
    orderBy: { createdAt: "desc" },
    with: PRODUCT_LIGHT_RELATIONS
  });
}

export async function createProduct(actorId: string, createReq: CreateProductRequest): Promise<Product> {
  const newProductId = uuidv7();

  if (createReq.itemIds?.length) {
    await validateItemIdsForProduct(createReq.itemIds, createReq.requiredAttributes);
  }

  await db.transaction(async (tx) => {
    await tx.insert(products).values({
      id: newProductId,
      slug: createReq.slug,
      title: createReq.title,
      shortDescription: createReq.shortDescription,
      markdownDescription: createReq.markdownDescription ?? null,
      imgUrls: createReq.imgUrls ?? null,
      displayPrice: createReq.displayPrice ?? null,
      comparePrice: createReq.comparePrice ?? null,
      status: createReq.status,
      requiredAttributes: createReq.requiredAttributes
    });

    if (createReq.itemIds?.length) {
      await tx.update(items).set({ productId: newProductId }).where(inArray(items.id, createReq.itemIds));
    }
  });

  const newProduct = await getProductById(newProductId);

  await recordAuditLog({
    actorId: actorId,
    code: "product-create",
    referenceType: "product",
    referenceId: newProductId,
    metadata: {
      product: newProduct
    }
  });

  return newProduct;
}

export async function updateProduct(actorId: string, productId: string, updateReq: UpdateProductRequest): Promise<Product> {
  const productBefore = await getProductById(productId);

  if (updateReq.itemIds !== undefined || updateReq.requiredAttributes !== undefined) {
    const effectiveItemIds = updateReq.itemIds ?? productBefore.items.map((item) => item.id);
    const effectiveRequiredAttributes = updateReq.requiredAttributes ?? productBefore.requiredAttributes;
    await validateItemIdsForProduct(effectiveItemIds, effectiveRequiredAttributes);
  }

  await db.transaction(async (tx) => {
    await tx.update(products).set({
      slug: updateReq.slug,
      title: updateReq.title,
      shortDescription: updateReq.shortDescription,
      markdownDescription: updateReq.markdownDescription,
      imgUrls: updateReq.imgUrls,
      displayPrice: updateReq.displayPrice,
      comparePrice: updateReq.comparePrice,
      status: updateReq.status,
      requiredAttributes: updateReq.requiredAttributes
    }).where(eq(products.id, productId));

    if (updateReq.itemIds !== undefined) {
      await reconcileProductItems(tx, productId, updateReq.itemIds);
    }
  });

  const productAfter = await getProductById(productId);

  await recordAuditLog({
    actorId: actorId,
    code: "product-update",
    referenceType: "product",
    referenceId: productId,
    metadata: {
      before: productBefore,
      after: productAfter
    }
  });

  return productAfter;
}

export async function deleteProduct(actorId: string, productId: string): Promise<void> {
  const productBefore = await getProductById(productId);

  // TODO: chỉ cho phép delete nếu chưa có order nào, nếu có rồi thì throw 409
  if (productBefore.items.length > 0) {
    throw new HTTPException(409, { message: "Cannot delete product with linked items" });
  }

  await db.delete(products).where(eq(products.id, productId));

  await recordAuditLog({
    actorId: actorId,
    code: "product-delete",
    referenceType: "product",
    referenceId: productId,
    metadata: {
      product: productBefore
    }
  });
}

export function areAttributeValuesValidForRequired(attrValuesList: ItemAttributeValues[], productRequiredAttributes: ItemAttribute[]): boolean {
  const requiredSet = new Set<ItemAttribute>(productRequiredAttributes);
  const seen = new Set<string>();

  for (const attrValues of attrValuesList) {
    const presentKeys: ItemAttribute[] = [];
    if (attrValues.COLOR !== undefined) presentKeys.push("COLOR");
    if (attrValues.SIZE !== undefined) presentKeys.push("SIZE");

    if (presentKeys.length !== requiredSet.size) return false;
    for (const k of presentKeys) {
      if (!requiredSet.has(k)) return false;
    }

    const identity = productRequiredAttributes
      .map((a) => (a === "COLOR" ? `COLOR:${attrValues.COLOR?.hex}` : `SIZE:${attrValues.SIZE}`))
      .join("|");
    if (seen.has(identity)) return false;
    seen.add(identity);
  }

  return true;
}

async function validateItemIdsForProduct(itemIds: string[], productRequiredAttributes: ItemAttribute[]): Promise<void> {
  if (itemIds.length === 0) {
    return;
  }

  const rows = await db.select({ attributeValues: items.attributeValues }).from(items).where(inArray(items.id, itemIds));
  const attrValuesList = rows.map((r) => r.attributeValues ?? {});

  if (!areAttributeValuesValidForRequired(attrValuesList, productRequiredAttributes)) {
    throw new HTTPException(409, { message: "Linked items do not satisfy product's required attributes" });
  }
}

async function reconcileProductItems(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], productId: string, itemIds: string[]): Promise<void> {
  if (itemIds.length === 0) {
    await tx.update(items).set({ productId: null }).where(eq(items.productId, productId));
    return;
  }

  await tx.update(items).set({ productId: null }).where(and(eq(items.productId, productId), notInArray(items.id, itemIds)));
  await tx.update(items).set({ productId: productId }).where(inArray(items.id, itemIds));
}