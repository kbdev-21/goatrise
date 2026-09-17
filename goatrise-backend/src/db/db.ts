import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { itemsRelations, productsRelations, ordersRelations } from "./relations.js";
import { users } from "./schema/users.schema.js";
import { POSTGRES_CONNECTION_URL } from "../core/env.js";
import { auditLogs } from "./schema/audit-logs.schema.js";
import { suppliers } from "./schema/suppliers.schema.js";
import { itemTransactions } from "./schema/item-transactions.schema.js";
import { items } from "./schema/items.schema.js";
import { products } from "./schema/products.schema.js";
import { collections } from "./schema/collections.schema.js";
import { collectionProducts } from "./schema/collection-products.schema.js";
import { orders } from "./schema/orders.schema.js";
import { orderLines } from "./schema/order-lines.schema.js";
import { customers } from "./schema/customers.schema.js";
import { coupons } from "./schema/coupons.schema.js";
import { combos } from "./schema/combos.schema.js";

const root = defineRelations({
  users,
  auditLogs,
  suppliers,
  itemTransactions,
  items,
  products,
  collections,
  collectionProducts,
  orders,
  orderLines,
  customers,
  coupons,
  combos
}, () => ({}));

export const db = drizzle({
  connection: {
    connectionString: POSTGRES_CONNECTION_URL,
    // ssl: {
    //   rejectUnauthorized: false
    // },
    ssl: false
  },
  relations: {
    ...root,
    ...itemsRelations,
    ...productsRelations,
    ...ordersRelations
  }
});

export type Db = typeof db;
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExec = Db | Tx;