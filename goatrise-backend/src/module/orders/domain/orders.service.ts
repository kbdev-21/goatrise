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
import { incrementCombosUsage } from "../../promotion/domain/combos.service.js";
import { soldItems } from "../../inventory/domain/inventory.service.js";
import { getOrCreateOrSyncCustomer } from "../../customers/domain/customers-sync.service.js";
import { updateCustomer } from "../../customers/domain/customers.service.js";
import type { UpdateCustomerRequest } from "../../customers/domain/validators.js";
import type { CreateOrderRequest, FindOrdersQuery, PlaceOrderRequest, UpdateOrderRequest } from "./validators.js";
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
    createReq.customerPhoneNum,
    createReq.channel
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
      customerPhoneNum: createReq.customerPhoneNum ?? null,
      customerAddress: createReq.customerAddress ?? null,
      couponId: couponId,
      combos: calculation.combos,
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
      note: createReq.note ?? null,
      createdAt: createReq.createdAt
    });

    const lineValues = calculation.lines.map((line) => ({
      id: uuidv7(),
      orderId: newOrderId,
      itemId: line.itemId,
      productId: line.productId,
      snapItem: line.snapItem,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotalAmount: line.subtotal,
      createdAt: createReq.createdAt
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

    // money inputs: đụng bất kỳ input nào -> phải tính lại nguyên khối (không cho set lẻ cột tiền)
    const pricingChanged =
      updateReq.lines !== undefined ||
      updateReq.couponCode !== undefined ||
      updateReq.manualDiscountAmount !== undefined ||
      updateReq.manualShippingFee !== undefined;

    // customer info + các field mở rộng khác (ngoài status/payment/createdAt vốn có rule riêng)
    const touchingExtraFields =
      pricingChanged ||
      updateReq.customerName !== undefined ||
      updateReq.customerEmail !== undefined ||
      updateReq.customerPhoneNum !== undefined ||
      updateReq.customerAddress !== undefined ||
      updateReq.paymentMethod !== undefined ||
      updateReq.channel !== undefined ||
      updateReq.referrerId !== undefined;

    // rule: đơn đã COMPLETED thì không được đổi status, paymentStatus lẫn createdAt nữa
    if (orderBefore.status === "COMPLETED") {
      const changingStatus = updateReq.status !== undefined && updateReq.status !== orderBefore.status;
      const changingPayment = updateReq.paymentStatus !== undefined && updateReq.paymentStatus !== orderBefore.paymentStatus;
      const changingCreatedAt = updateReq.createdAt !== undefined && updateReq.createdAt.getTime() !== orderBefore.createdAt.getTime();
      if (changingStatus || changingPayment || changingCreatedAt) {
        throw new HTTPException(409, { message: "Cannot change status, payment status or created date of a completed order" });
      }

      // đơn đã COMPLETED: đã trừ kho + áp coupon + cộng stats -> chỉ cho sửa note, chặn full update
      if (touchingExtraFields) {
        throw new HTTPException(409, { message: "Cannot edit customer info, lines or pricing of a completed order" });
      }
    }

    // rule: chưa PAID thì không được set status COMPLETED
    const effectivePaymentStatus = updateReq.paymentStatus ?? orderBefore.paymentStatus;
    if (updateReq.status === "COMPLETED" && effectivePaymentStatus !== "PAID") {
      throw new HTTPException(409, { message: "Cannot complete an order that is not paid" });
    }

    // createdAt hiệu lực (dùng cho cả order lẫn orderLines rebuild)
    const effectiveCreatedAt = updateReq.createdAt ?? orderBefore.createdAt;

    // tính lại khối tiền từ input đã merge (update ?? giá trị hiện tại của order)
    let pricing: Partial<typeof orders.$inferInsert> = {};
    if (pricingChanged) {
      const effectiveLines = updateReq.lines
        ?? orderBefore.lines.map((line) => ({ itemId: line.itemId, quantity: line.quantity }));

      // couponCode: undefined = giữ coupon hiện tại (lấy code từ relation); null = bỏ coupon; string = coupon mới
      const effectiveCouponCode = updateReq.couponCode === undefined
        ? (orderBefore.coupon?.code ?? undefined)
        : (updateReq.couponCode ?? undefined);

      const effectivePhoneNum = updateReq.customerPhoneNum === undefined
        ? (orderBefore.customerPhoneNum ?? undefined)
        : (updateReq.customerPhoneNum ?? undefined);

      const calculation = await calculateOrder(tx, {
        lines: effectiveLines,
        customerPhoneNum: effectivePhoneNum,
        couponCode: effectiveCouponCode,
        manualDiscountAmount: updateReq.manualDiscountAmount ?? orderBefore.manualDiscountAmount,
        manualShippingFee: updateReq.manualShippingFee ?? orderBefore.shippingAmount
      });

      // chưa completed nên coupon chưa bị "tiêu"; chỉ resolve lại couponId để gắn vào order
      const coupon = effectiveCouponCode ? await getCouponByCode(tx, effectiveCouponCode) : null;

      pricing = {
        couponId: coupon?.id ?? null,
        combos: calculation.combos,
        subtotalAmount: calculation.subtotal,
        manualDiscountAmount: calculation.manualDiscount,
        couponDiscountAmount: calculation.couponDiscount,
        comboDiscountAmount: calculation.comboDiscount,
        shippingAmount: calculation.shipping,
        taxAmount: calculation.tax,
        totalAmount: calculation.total
      };

      // rebuild toàn bộ orderLines theo snapshot mới (kho chưa bị trừ trước COMPLETED nên swap tự do)
      await tx.delete(orderLines).where(eq(orderLines.orderId, orderId));
      await tx.insert(orderLines).values(calculation.lines.map((line) => ({
        id: uuidv7(),
        orderId: orderId,
        itemId: line.itemId,
        productId: line.productId,
        snapItem: line.snapItem,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotalAmount: line.subtotal,
        createdAt: effectiveCreatedAt
      })));
    }

    await tx.update(orders).set({
      // customer info: ghi đè snapshot (undefined = giữ nguyên, null = xóa)
      customerName: updateReq.customerName,
      customerEmail: updateReq.customerEmail,
      customerPhoneNum: updateReq.customerPhoneNum,
      customerAddress: updateReq.customerAddress,
      paymentMethod: updateReq.paymentMethod,
      referrerId: updateReq.referrerId,
      channel: updateReq.channel,
      paymentStatus: updateReq.paymentStatus,
      status: updateReq.status,
      note: updateReq.note,
      createdAt: updateReq.createdAt,
      ...pricing
    }).where(eq(orders.id, orderId));

    // đồng bộ createdAt của các orderLines theo createdAt của order (nếu có cập nhật).
    // bỏ qua khi pricingChanged vì lines đã được rebuild với effectiveCreatedAt ở trên.
    if (updateReq.createdAt !== undefined && !pricingChanged) {
      await tx.update(orderLines).set({
        createdAt: updateReq.createdAt
      }).where(eq(orderLines.orderId, orderId));
    }

    // đụng name/phone của customer -> hồi tố luôn vào bản ghi customers (nguồn sự thật).
    // email không sync (updateCustomer không nhận email + email unique dễ đụng customer khác).
    // phoneNum null (xóa trên order) -> bỏ qua, không null hóa phone của customer.
    const customerSync: UpdateCustomerRequest = {};
    if (updateReq.customerName !== undefined) {
      customerSync.name = updateReq.customerName;
    }
    if (typeof updateReq.customerPhoneNum === "string") {
      customerSync.phoneNum = updateReq.customerPhoneNum;
    }
    if (Object.keys(customerSync).length > 0) {
      await updateCustomer(tx, actorId, orderBefore.customerId, customerSync);
    }

    // chuyển sang COMPLETED (từ trạng thái khác) -> trừ stock + áp coupon + cập nhật stats customer.
    // dùng snapshot MỚI (đọc lại) để onComplete phản ánh đúng lines/coupon/total vừa sửa.
    if (updateReq.status === "COMPLETED" && orderBefore.status !== "COMPLETED") {
      const orderForComplete = await getOrderById(tx, orderId);
      await onCompleteOrder(tx, orderForComplete);
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
    await applyCoupon(db, order.couponId, order.subtotalAmount, order.customerPhoneNum ?? "");
  }

  // +1 usedCount cho từng combo đã áp vào đơn (chỉ khi đơn hoàn tất)
  await incrementCombosUsage(db, order.combos.map((combo) => combo.id));

  // TODO: loyaltyPoints để dành cho feature riêng sau này
  await db.update(customers).set({
    totalSpent: sql`${customers.totalSpent} + ${order.totalAmount}`,
    totalOrders: sql`${customers.totalOrders} + 1`,
    lastOrderAt: new Date()
  }).where(eq(customers.id, order.customerId));
}

async function generateUniqueOrderCode(db: DbExec): Promise<string> {
  const maxAttemps = 5;
  for (let attempt = 0; attempt < maxAttemps; attempt++) {
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