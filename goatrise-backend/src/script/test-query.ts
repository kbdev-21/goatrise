import { sql } from "drizzle-orm"
import { db } from "../db/db.js"

const query = 
  `
    SELECT
      table_schema,
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema IN ('public')
    ORDER BY
      table_schema,
      table_name,
      ordinal_position;
  `
const queryResult = await db.execute(sql.raw(query))
console.log(JSON.stringify(queryResult.rows))