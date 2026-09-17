import type { ProductDb } from "../../db/schema/products.schema.js";
import type { CollectionDb } from "../../db/schema/collections.schema.js";
import type { ItemDb } from "../../db/schema/items.schema.js";

export type Product = ProductDb & {
  items: ItemDb[],
};
export const PRODUCT_RELATIONS = {
  items: true
};

export type ProductFull = ProductDb & {
  items: ItemDb[],
  collections: CollectionDb[]
};
export const PRODUCT_FULL_RELATIONS = {
  items: true,
  collections: true
};

export type Collection = CollectionDb & {
  products: ProductDb[],
  parent: CollectionDb | null,
  children: CollectionDb[]
};
export const COLLECTION_RELATIONS = {
  products: true,
  parent: true,
  children: true
};

export type CollectionFull = CollectionDb & {
  products: Product[],
  parent: CollectionDb | null,
  children: CollectionDb[]
};
export const COLLECTION_FULL_RELATIONS = {
  products: {
    with: PRODUCT_RELATIONS
  },
  parent: true,
  children: true
};
