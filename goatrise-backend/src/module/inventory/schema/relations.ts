import { defineRelationsPart } from "drizzle-orm";
import { itemTransactions } from "./item-transactions.schema.js";
import { items } from "./items.schema.js";
import { suppliers } from "./suppliers.schema.js";
import { users } from "../../users/schema/users.schema.js";

export const itemTransactionsRelations = defineRelationsPart({itemTransactions, items, suppliers, users}, (r) => ({
  itemTransactions: {
    item: r.one.items({
      to: r.items.id,
      from: r.itemTransactions.itemId,
      optional: false
    }),
    actor: r.one.users({
      to: r.users.id,
      from: r.itemTransactions.actorId
    }),
    supplier: r.one.suppliers({
      to: r.suppliers.id,
      from: r.itemTransactions.supplierId
    })
  }
}));