import { defineRelationsPart } from "drizzle-orm";
import { products } from "./products.schema.js";
import { collectionProducts } from "./collection-products.schema.js";
import { collections } from "./collections.schema.js";
import { items } from "../../inventory/schema/items.schema.js";

export const productsRelations = defineRelationsPart({ products, collectionProducts, collections, items }, (r) => ({
  products: {
    items: r.many.items({
      to: r.items.productId,
      from: r.products.id,
    }),
    collections: r.many.collections({
      to: r.collections.id.through(r.collectionProducts.collectionId),
      from: r.products.id.through(r.collectionProducts.productId)
    })
  },
  
  collections: {
    products: r.many.products({
      from: r.collections.id.through(r.collectionProducts.collectionId),
      to: r.products.id.through(r.collectionProducts.productId)
    })
  }
}));