import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { itemsRelations } from "../module/inventory/schema/relations.js";
import { users } from "../module/auth/schema/users.schema.js";
import { POSTGRES_CONNECTION_URL } from "./env.js";
import { auditLogs } from "../module/audit/schema/audit-logs.schema.js";
import { suppliers } from "../module/inventory/schema/suppliers.schema.js";
import { itemTransactions } from "../module/inventory/schema/item-transactions.schema.js";
import { items } from "../module/inventory/schema/items.schema.js";
import { products } from "../module/catalog/schema/products.schema.js";
import { collections } from "../module/catalog/schema/collections.schema.js";
import { collectionProducts } from "../module/catalog/schema/collection-products.schema.js";
import { productsRelations } from "../module/catalog/schema/relations.js";
import { orders } from "../module/orders/schema/orders.schema.js";
import { orderLines } from "../module/orders/schema/order-lines.schema.js";
import { ordersRelations } from "../module/orders/schema/relations.js";
import { customers } from "../module/customers/schema/customers.schema.js";

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
  customers
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