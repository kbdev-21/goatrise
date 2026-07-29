import { customers } from "../schema/customers.schema.js";

export type CustomerBase = typeof customers.$inferSelect;

export type Customer = CustomerBase;
