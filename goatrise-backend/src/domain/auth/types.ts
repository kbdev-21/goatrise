import type { UserDb } from "../../db/schema/users.schema.js";
import type { Customer } from "../customers/types.js";

export type User = UserDb;

// user + customer nối qua email. null khi chưa có customer trùng email
// (customer chỉ được tạo khi đặt đơn hoặc khi user tự cập nhật qua PATCH /customers/me)
export type UserDetail = User & {
  customer: Customer | null
};
