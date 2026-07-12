import { db } from "../../../core/db.js";

export const baseCustomerRelations = {};
const baseCustomerQuery = db.query.customers.findFirst();
export type Customer = NonNullable<Awaited<typeof baseCustomerQuery>>;
