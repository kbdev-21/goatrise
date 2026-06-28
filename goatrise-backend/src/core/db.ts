import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { usersRelations } from "../module/users/schema/relations.js";
import { itemTransactionsRelations } from "../module/inventory/schema/relations.js";
import { users } from "../module/users/schema/users.schema.js";
import { POSTGRES_CONNECTION_URL } from "./env.js";
import { auditLogs } from "../module/audit/schema/audit-logs.schema.js";
import { suppliers } from "../module/inventory/schema/suppliers.schema.js";
import { itemTransactions } from "../module/inventory/schema/item-transactions.schema.js";
import { items } from "../module/inventory/schema/items.schema.js";

const root = defineRelations({
  users,
  auditLogs,
  suppliers,
  itemTransactions,
  items
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
    ...usersRelations, 
    ...itemTransactionsRelations 
  }
});
