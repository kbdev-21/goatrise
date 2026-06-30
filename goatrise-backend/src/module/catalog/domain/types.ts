import { db } from "../../../core/db.js";

export const PRODUCT_RELATIONS = {
  items: true,
  collections: true
};
const fullProductQuery = db.query.products.findFirst({
  with: PRODUCT_RELATIONS
});
export type Product = NonNullable<Awaited<typeof fullProductQuery>>;

export const PRODUCT_LIGHT_RELATIONS = {
  items: true
}

const lightProductQuery = db.query.products.findFirst({
  with: PRODUCT_LIGHT_RELATIONS
});
export type ProductSummary = NonNullable<Awaited<typeof lightProductQuery>>;