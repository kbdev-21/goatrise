import type { DbExec } from "../../../core/db.js";
import { orders } from "../schema/orders.schema.js";
import { orderLines } from "../schema/order-lines.schema.js";
import { customers } from "../../customers/schema/customers.schema.js";
import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import { calculateOrder } from "./order-calculation.service.js";
import { applyCoupon, getCouponByCode } from "../../promotion/domain/coupons.service.js";
import { soldItems } from "../../inventory/domain/inventory.service.js";
import { getOrCreateOrSyncCustomer } from "../../customers/domain/customers-sync.service.js";
import type { CreateOrderRequest, FindOrdersQuery, PlaceOrderRequest, UpdateOrderRequest } from "./validators.js";
import { ORDER_RELATIONS, type Order } from "./types.js";

const MAX_ATTEMPTS = 5;

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

export async function createOrder(db: DbExec, actorId: string | null, createReq: CreateOrderRequest): Promise<Order> {
  // rule: chưa PAID thì không được set status COMPLETED
  if (createReq.status === "COMPLETED" && createReq.paymentStatus !== "PAID") {
    throw new HTTPException(409, { message: "Cannot complete an order that is not paid" });
  }

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
      customerPhoneNum: createReq.customerPhoneNum,
      couponCode: createReq.couponCode,
      manualDiscountAmount: createReq.manualDiscountAmount,
      manualShippingFee: createReq.manualShippingFee
    });

    // chỉ resolve couponId để gắn vào order; việc đánh dấu coupon đã dùng (applyCoupon)
    // được dời sang onCompleteOrder -> coupon chỉ bị "tiêu" khi đơn hoàn tất.
    const coupon = createReq.couponCode ? await getCouponByCode(tx, createReq.couponCode) : null;
    const couponId = coupon?.id ?? null;

    const code = await generateUniqueOrderCode(tx);

    await tx.insert(orders).values({
      id: newOrderId,
      code: code,
      customerId: customer.id,
      customerName: createReq.customerName,
      customerEmail: createReq.customerEmail ?? null,
      customerPhoneNum: createReq.customerPhoneNum,
      customerAddress: createReq.customerAddress,
      couponId: couponId,
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

    if (createReq.status === "COMPLETED") {
      await onCompleteOrder(tx, newOrder);
    }

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

// khách tự đặt đơn (public, không actor): bổ sung các field admin bằng default rồi gọi createOrder
export async function placeOrder(db: DbExec, placeReq: PlaceOrderRequest): Promise<Order> {
  const createReq: CreateOrderRequest = {
    ...placeReq,
    channel: "WEBSITE"
  };

  return await createOrder(db, null, createReq);
}

export async function updateOrder(db: DbExec, actorId: string, orderId: string, updateReq: UpdateOrderRequest): Promise<Order> {
  return await db.transaction(async (tx) => {
    // khóa row order (FOR UPDATE) để 2 request complete song song không cùng qua guard -> tránh double-complete
    await tx.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).for("update");
    const orderBefore = await getOrderById(tx, orderId);

    // rule: đơn đã COMPLETED thì không được đổi status lẫn paymentStatus nữa
    if (orderBefore.status === "COMPLETED") {
      const changingStatus = updateReq.status !== undefined && updateReq.status !== orderBefore.status;
      const changingPayment = updateReq.paymentStatus !== undefined && updateReq.paymentStatus !== orderBefore.paymentStatus;
      if (changingStatus || changingPayment) {
        throw new HTTPException(409, { message: "Cannot change status or payment status of a completed order" });
      }
    }

    // rule: chưa PAID thì không được set status COMPLETED
    const effectivePaymentStatus = updateReq.paymentStatus ?? orderBefore.paymentStatus;
    if (updateReq.status === "COMPLETED" && effectivePaymentStatus !== "PAID") {
      throw new HTTPException(409, { message: "Cannot complete an order that is not paid" });
    }

    await tx.update(orders).set({
      paymentStatus: updateReq.paymentStatus,
      status: updateReq.status,
      note: updateReq.note
    }).where(eq(orders.id, orderId));

    // chuyển sang COMPLETED (từ trạng thái khác) -> trừ stock + áp coupon + cập nhật stats customer
    if (updateReq.status === "COMPLETED" && orderBefore.status !== "COMPLETED") {
      await onCompleteOrder(tx, orderBefore);
    }

    const orderAfter = await getOrderById(tx, orderId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "order-update",
      referenceType: "order",
      referenceId: orderId,
      metadata: {
        before: orderBefore,
        after: orderAfter
      }
    });

    return orderAfter;
  });
}

async function onCompleteOrder(db: DbExec, order: Order): Promise<void> {
  const lines = order.lines.flatMap((line) =>
    line.itemId !== null ? [{ itemId: line.itemId, quantity: line.quantity }] : []
  );

  // trừ stock + ghi transaction SOLD cho từng item trong đơn
  await soldItems(db, lines);

  // đánh dấu coupon đã dùng (chỉ khi đơn hoàn tất)
  if (order.couponId) {
    await applyCoupon(db, order.couponId, order.subtotalAmount, order.customerPhoneNum);
  }

  // TODO: loyaltyPoints để dành cho feature riêng sau này
  await db.update(customers).set({
    totalSpent: sql`${customers.totalSpent} + ${order.totalAmount}`,
    totalOrders: sql`${customers.totalOrders} + 1`,
    lastOrderAt: new Date()
  }).where(eq(customers.id, order.customerId));
}

async function generateUniqueOrderCode(db: DbExec): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const datePart = `${dd}${mm}${yy}`;

    const chars = "0123456789";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }

    const code = `ORD${datePart}${randomPart}`;

    const existing = await db.query.orders.findFirst({ where: { code: code } });
    if (!existing) {
      return code;
    }
  }
  throw new HTTPException(500, { message: "Failed to generate unique order code" });
}