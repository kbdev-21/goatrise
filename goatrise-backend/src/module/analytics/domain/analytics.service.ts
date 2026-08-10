import { and, count, eq, getColumns, gte, lte, sql, sum } from "drizzle-orm";
import type { DbExec } from "../../../core/db.js";
import { orders } from "../../orders/schema/orders.schema.js";
import { customers } from "../../customers/schema/customers.schema.js";
import { orderLines } from "../../orders/schema/order-lines.schema.js";
import { products } from "../../catalog/schema/products.schema.js";
import { items } from "../../inventory/schema/items.schema.js";
import type { ProductBase } from "../../catalog/domain/types.js";
import type { ItemBase } from "../../inventory/domain/types.js";

export async function countOrders(
  db: DbExec,
  from?: Date,
  to?: Date,
): Promise<number> {
  const [res] = await db
    .select({ count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.status, "COMPLETED"),
        from ? gte(orders.createdAt, from) : undefined,
        to ? lte(orders.createdAt, to) : undefined,
      ),
    );

  return res.count;
}

export async function countCustomers(
  db: DbExec,
  from?: Date,
  to?: Date,
): Promise<number> {
  const [res] = await db
    .select({ count: count() })
    .from(customers)
    .where(
      and(
        from ? gte(customers.createdAt, from) : undefined,
        to ? lte(customers.createdAt, to) : undefined,
      ),
    );

  return res.count;
}

export async function calculateRevenue(
  db: DbExec,
  from?: Date,
  to?: Date,
): Promise<number> {
  const [res] = await db
    .select({ sum: sum(orders.totalAmount) })
    .from(orders)
    .where(
      and(
        eq(orders.status, "COMPLETED"),
        from ? gte(orders.createdAt, from) : undefined,
        to ? lte(orders.createdAt, to) : undefined,
      ),
    );

  return Number(res.sum ?? 0);
}

// doanh thu gộp theo từng ngày (theo orders.createdAt) trong khoảng [from, to].
// ngày không có đơn sẽ không xuất hiện -> caller tự fill 0 cho các ngày trống.
export async function calculateDailyRevenue(
  db: DbExec,
  from: Date,
  to: Date,
): Promise<{ date: string, revenue: number }[]> {
  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      revenue: sum(orders.totalAmount),
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "COMPLETED"),
        gte(orders.createdAt, from),
        lte(orders.createdAt, to),
      ),
    )
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

  return rows.map((row) => ({
    date: row.date,
    revenue: Number(row.revenue ?? 0),
  }));
}

// số đơn gộp theo từng ngày (theo orders.createdAt) trong khoảng [from, to].
// ngày không có đơn sẽ không xuất hiện -> caller tự fill 0 cho các ngày trống.
export async function calculateDailyOrders(
  db: DbExec,
  from: Date,
  to: Date,
): Promise<{ date: string, count: number }[]> {
  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "COMPLETED"),
        gte(orders.createdAt, from),
        lte(orders.createdAt, to),
      ),
    )
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

  return rows.map((row) => ({
    date: row.date,
    count: Number(row.count),
  }));
}

// doanh thu gộp theo từng tháng (theo orders.createdAt) trong khoảng [from, to].
// tháng không có đơn sẽ không xuất hiện -> caller tự fill 0 cho các tháng trống.
export async function calculateMonthlyRevenue(
  db: DbExec,
  from: Date,
  to: Date,
): Promise<{ month: string, revenue: number }[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'YYYY-MM')`,
      revenue: sum(orders.totalAmount),
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "COMPLETED"),
        gte(orders.createdAt, from),
        lte(orders.createdAt, to),
      ),
    )
    .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('month', ${orders.createdAt})`);

  return rows.map((row) => ({
    month: row.month,
    revenue: Number(row.revenue ?? 0),
  }));
}

// số đơn gộp theo từng tháng (theo orders.createdAt) trong khoảng [from, to].
// tháng không có đơn sẽ không xuất hiện -> caller tự fill 0 cho các tháng trống.
export async function calculateMonthlyOrders(
  db: DbExec,
  from: Date,
  to: Date,
): Promise<{ month: string, count: number }[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'YYYY-MM')`,
      count: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "COMPLETED"),
        gte(orders.createdAt, from),
        lte(orders.createdAt, to),
      ),
    )
    .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('month', ${orders.createdAt})`);

  return rows.map((row) => ({
    month: row.month,
    count: Number(row.count),
  }));
}

export async function calculateProductSales(
  db: DbExec,
  from?: Date,
  to?: Date,
): Promise<{
  product: ProductBase,
  sold: number
}[]> {
  const sales = db
    .select({
      productId: orderLines.productId,
      totalQuantity: sum(orderLines.quantity).as("totalQuantity"),
    })
    .from(orderLines)
    .innerJoin(orders, eq(orderLines.orderId, orders.id))
    .where(
      and(
        eq(orders.status, "COMPLETED"),
        from ? gte(orderLines.createdAt, from) : undefined,
        to ? lte(orderLines.createdAt, to) : undefined,
      ),
    )
    .groupBy(orderLines.productId)
    .as("sales");

  const result = await db
    .select({
      ...getColumns(products),
      totalQuantity: sql<number>`coalesce(${sales.totalQuantity}, 0)`,
    })
    .from(products)
    .leftJoin(sales, eq(products.id, sales.productId));

  const sold = result.map(r => {
    const { totalQuantity, ...product } = r;
    return {
      product: product,
      sold: r.totalQuantity
    }
  });

  return sold;
}

export async function calculateItemSales(
  db: DbExec,
  from?: Date,
  to?: Date,
): Promise<{
  item: ItemBase,
  sold: number
}[]> {
  const sales = db
    .select({
      itemId: orderLines.itemId,
      totalQuantity: sum(orderLines.quantity).as("totalQuantity"),
    })
    .from(orderLines)
    .innerJoin(orders, eq(orderLines.orderId, orders.id))
    .where(
      and(
        eq(orders.status, "COMPLETED"),
        from ? gte(orderLines.createdAt, from) : undefined,
        to ? lte(orderLines.createdAt, to) : undefined,
      ),
    )
    .groupBy(orderLines.itemId)
    .as("sales");

  const result = await db
    .select({
      ...getColumns(items),
      totalQuantity: sql<number>`coalesce(${sales.totalQuantity}, 0)`,
    })
    .from(items)
    .leftJoin(sales, eq(items.id, sales.itemId));

  const sold = result.map(r => {
    const { totalQuantity, ...item } = r;
    return {
      item: item,
      sold: r.totalQuantity
    }
  });

  return sold;
}