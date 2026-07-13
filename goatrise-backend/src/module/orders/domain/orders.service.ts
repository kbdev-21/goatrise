import type { DbExec } from "../../../core/db.js";
import { orders } from "../schema/orders.schema.js";
import { orderLines } from "../schema/order-lines.schema.js";
import { HTTPException } from "hono/http-exception";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import { calculateOrder } from "./order-calculation.service.js";
import { getOrCreateOrSyncCustomer } from "../../customers/domain/customers-sync.service.js";
import type { CreateOrderRequest, FindOrdersQuery } from "./validators.js";
import { ORDER_RELATIONS, type Order } from "./types.js";

export async function getOrderById(db: DbExec, id: string): Promise<Order> {
  const order = await db.query.orders.findFirst({
    where: {
      id: id
    },
    with: ORDER_RELATIONS
  });

  if (!order) {
    throw new HTTPException(404, { message: "Order not found" });
  }

  return order;
}

export async function findOrders(db: DbExec, query: FindOrdersQuery): Promise<Order[]> {
  const { search, channel, status, sort, offset, limit } = query;
  const [sortField, sortDirection] = sort.split(":");
  const direction: "asc" | "desc" = sortDirection === "ASC" ? "asc" : "desc";

  return await db.query.orders.findMany({
    where: {
      ...(search ? {
        OR: [
          { code: { ilike: `%${search}%` } },
          { customerName: { ilike: `%${search}%` } },
          { customerPhoneNum: { ilike: `%${search}%` } },
          { customerEmail: { ilike: `%${search}%` } }
        ]
      } : {}),
      ...(channel ? { channel: channel } : {}),
      ...(status ? { status: status } : {})
    },
    with: ORDER_RELATIONS,
    offset: offset,
    limit: limit,
    orderBy: sortField === "totalAmount"
      ? { totalAmount: direction }
      : { createdAt: direction }
  });
}

export async function createOrder(db: DbExec, actorId: string, createReq: CreateOrderRequest): Promise<Order> {
  const newOrderId = uuidv7();

  // lấy/tạo/sync customer chạy NGOÀI transaction: cơ chế bắt unique-violation (23505) rồi
  // đọc lại để xử lý race không hoạt động bên trong một transaction cha (Postgres abort cả tx
  // khi một statement lỗi). Customer get-or-create là idempotent nên không cần atomic với order.
  const customer = await getOrCreateOrSyncCustomer(
    db,
    createReq.customerName,
    createReq.customerEmail,
    createReq.customerPhoneNum
  );

  return await db.transaction(async (tx) => {
    const calculation = await calculateOrder(tx, {
      lines: createReq.lines,
      manualDiscountAmount: createReq.manualDiscountAmount,
      manualShippingFee: createReq.manualShippingFee
    });

    await tx.insert(orders).values({
      id: newOrderId,
      code: generateOrderCode(),
      customerId: customer.id,
      customerName: createReq.customerName,
      customerEmail: createReq.customerEmail ?? null,
      customerPhoneNum: createReq.customerPhoneNum,
      customerAddress: createReq.customerAddress,
      couponCode: createReq.couponCode ?? null,
      subtotalAmount: calculation.subtotal,
      manualDiscountAmount: calculation.manualDiscount,
      couponDiscountAmount: calculation.couponDiscount,
      comboDiscountAmount: calculation.comboDiscount,
      shippingAmount: calculation.shipping,
      taxAmount: calculation.tax,
      totalAmount: calculation.total,
      paymentMethod: createReq.paymentMethod,
      paymentStatus: createReq.paymentStatus,
      status: createReq.status,
      channel: createReq.channel,
      referrerId: createReq.referrerId ?? null,
      creatorId: actorId,
      note: createReq.note ?? null
    });

    const lineValues = calculation.lines.map((line) => ({
      id: uuidv7(),
      orderId: newOrderId,
      itemId: line.itemId,
      productId: line.productId,
      snapItem: line.snapItem,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotalAmount: line.subtotal
    }));

    await tx.insert(orderLines).values(lineValues);

    const newOrder = await getOrderById(tx, newOrderId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "order-create",
      referenceType: "order",
      referenceId: newOrderId,
      metadata: {
        order: newOrder
      }
    });

    return newOrder;
  });
}

function generateOrderCode(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}