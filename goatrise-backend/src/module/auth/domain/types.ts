import { db } from "../../../core/db.js";

export const baseUserRelations = {};
const baseUserQuery = db.query.users.findFirst();
export type User = NonNullable<Awaited<typeof baseUserQuery>>;