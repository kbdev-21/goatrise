import { defineRelationsPart } from "drizzle-orm";
import { itemTransactions } from "./item-transactions.schema.js";
import { items } from "./items.schema.js";
import { suppliers } from "./suppliers.schema.js";
import { users } from "../../users/schema/users.schema.js";
import { products } from "../../catalog/schema/products.schema.js";

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