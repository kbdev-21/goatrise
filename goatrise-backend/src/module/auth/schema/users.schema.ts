import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  role: text("role").$type<UserRole>().notNull(),
  fullName: text("full_name").notNull(),
  normalizedFullName: text("normalized_full_name").notNull(),
  email: text("email").unique().notNull(),
  phoneNum: text("phone_num").unique(),
  avtUrl: text("avt_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  index().on(t.role),
  index().on(t.email),
  index().on(t.phoneNum),
]);

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";
