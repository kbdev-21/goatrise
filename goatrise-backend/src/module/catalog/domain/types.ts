import { products } from "../schema/products.schema.js";
import { collections } from "../schema/collections.schema.js";
import { collectionProducts } from "../schema/collection-products.schema.js";
import type { ItemBase } from "../../inventory/domain/types.js";

export type ProductBase = typeof products.$inferSelect;
export type CollectionBase = typeof collections.$inferSelect;
export type CollectionProductBase = typeof collectionProducts.$inferSelect;

export type Product = ProductBase & {
  items: ItemBase[],
};
export const PRODUCT_RELATIONS = {
  items: true
};

export type ProductFull = ProductBase & {
  items: ItemBase[],
  collections: CollectionBase[]
};
export const PRODUCT_FULL_RELATIONS = {
  items: true,
  collections: true
};

export type Collection = CollectionBase & {
  products: ProductBase[],
  parent: CollectionBase | null,
  children: CollectionBase[]
};
export const COLLECTION_RELATIONS = {
  products: true,
  parent: true,
  children: true
};

export type CollectionFull = CollectionBase & {
  products: Product[],
  parent: CollectionBase | null,
  children: CollectionBase[]
};
export const COLLECTION_FULL_RELATIONS = {
  products: {
    with: PRODUCT_RELATIONS
  },
  parent: true,
  children: true
};
