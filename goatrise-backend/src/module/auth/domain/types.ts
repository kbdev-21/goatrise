import { users } from "../schema/users.schema.js";

export type UserBase = typeof users.$inferSelect;

export type User = UserBase;
