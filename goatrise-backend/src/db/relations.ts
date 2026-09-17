import { defineRelationsPart } from "drizzle-orm";
import { itemTransactions } from "./schema/item-transactions.schema.js";
import { items } from "./schema/items.schema.js";
import { suppliers } from "./schema/suppliers.schema.js";
import { users } from "./schema/users.schema.js";
import { products } from "./schema/products.schema.js";
import { collectionProducts } from "./schema/collection-products.schema.js";
import { collections } from "./schema/collections.schema.js";
import { orders } from "./schema/orders.schema.js";
import { orderLines } from "./schema/order-lines.schema.js";
import { coupons } from "./schema/coupons.schema.js";

export const itemsRelations = defineRelationsPart({ itemTransactions, items, suppliers, users, products }, (r) => ({
  items: {
    product: r.one.products({
      to: r.products.id,
      from: r.items.productId
    })
  },

  itemTransactions: {
    actor: r.one.users({
      to: r.users.id,
      from: r.itemTransactions.actorId
    })
  }
}));

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
    }),
    parent: r.one.collections({
      from: r.collections.parentId,
      to: r.collections.id,
      optional: true,
      alias: "collectionHierarchy"
    }),
    children: r.many.collections({
      from: r.collections.id,
      to: r.collections.parentId,
      alias: "collectionHierarchy"
    })
  }
}));

export const ordersRelations = defineRelationsPart({ orders, orderLines, coupons }, (r) => ({
  orders: {
    lines: r.many.orderLines({
      to: r.orderLines.orderId,
      from: r.orders.id
    }),
    coupon: r.one.coupons({
      to: r.coupons.id,
      from: r.orders.couponId
    })
  },

  orderLines: {
    order: r.one.orders({
      to: r.orders.id,
      from: r.orderLines.orderId
    })
  }
}));
