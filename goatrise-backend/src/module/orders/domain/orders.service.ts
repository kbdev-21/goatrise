import type { DbExec } from "../../../core/db.js";
import { orders } from "../schema/orders.schema.js";
import { orderLines } from "../schema/order-lines.schema.js";
import { customers } from "../../customers/schema/customers.schema.js";
import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import { calculateOrder } from "./order-calculation.service.js";
import { applyCoupon, getCouponByCode, revokeCoupon } from "../../promotion/domain/coupons.service.js";
import { decrementCombosUsage, incrementCombosUsage } from "../../promotion/domain/combos.service.js";
import { refundItems, soldItems } from "../../inventory/domain/inventory.service.js";
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
          { platformOrderId: { ilike: `%${search}%` } },
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
    // được dời sang onConfirmOrder -> coupon chỉ bị "tiêu" khi đơn được confirm.
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
      deliveryStatus: createReq.deliveryStatus,
      channel: createReq.channel,
      platformOrderId: createReq.platformOrderId ?? null,
      platformCost: createReq.platformCost,
      taxCost: createReq.taxCost,
      shippingCost: createReq.shippingCost,
      otherCost: createReq.otherCost,
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

    if (createReq.status === "CONFIRMED") {
      await onConfirmOrder(tx, newOrder);
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

// điều phối update: quyết side effect MỘT LẦN ở đầu (dựa trên status trước/sau + khối tiền
// có đổi không), rồi mới ghi data. Tách quyết định ra khỏi 2 hàm ghi bên dưới để một PATCH
// vừa đổi giá vừa đổi status không bị revert 2 lần.
export async function updateOrder(db: DbExec, actorId: string, orderId: string, updateReq: UpdateOrderRequest): Promise<Order> {
  return await db.transaction(async (tx) => {
    // khóa row order (FOR UPDATE) để 2 request song song không cùng qua guard -> tránh double side effect
    await tx.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).for("update");
    const orderBefore = await getOrderById(tx, orderId);

    const pricingChanged = isPricingChanged(updateReq);

    const wasConfirmed = orderBefore.status === "CONFIRMED";
    const effectiveStatus = updateReq.status ?? orderBefore.status;

    // phone đổi thật sự (undefined = giữ nguyên, trùng giá trị cũ = không tính là đổi).
    // so sánh giá trị chứ không xét sự có mặt như pricingChanged: client gửi kèm phone ở
    // mọi PATCH, xét có mặt sẽ chặn luôn cả những update không liên quan.
    const changingPhoneNum =
      updateReq.customerPhoneNum !== undefined &&
      updateReq.customerPhoneNum !== orderBefore.customerPhoneNum;

    // rule: đơn đã CONFIRMED mà CÓ COUPON thì đóng băng khối tiền lẫn phone.
    // - đổi giá buộc phải revert + confirm lại -> applyCoupon chạy lần hai và sẽ ném 400 nếu
    //   coupon đã hết hạn/hết lượt kể từ lúc confirm.
    // - đổi phone thì coupon.usedPhoneNums vẫn giữ phone CŨ (không revert/confirm lại), nên
    //   chủ mới của đơn được hưởng giảm giá mà không bị ghi nhận -> dùng lại coupon được.
    // Muốn đổi thì set CANCELLED rồi tạo đơn mới.
    if (wasConfirmed && orderBefore.couponId !== null) {
      if (pricingChanged) {
        throw new HTTPException(409, { message: "Cannot change pricing of a confirmed order that used a coupon" });
      }
      if (changingPhoneNum) {
        throw new HTTPException(409, { message: "Cannot change phone number of a confirmed order that used a coupon" });
      }
    }

    // rời khỏi CONFIRMED, hoặc ở lại CONFIRMED nhưng đổi giá -> nhả side effect cũ
    const needRevert = wasConfirmed && (pricingChanged || effectiveStatus !== "CONFIRMED");
    // vào CONFIRMED, hoặc ở lại CONFIRMED nhưng đổi giá -> áp side effect theo data MỚI
    const needConfirm = effectiveStatus === "CONFIRMED" && (!wasConfirmed || pricingChanged);

    // revert TRƯỚC khi updateOrderData chạy calculateOrder: stock phải được trả lại thì
    // check `quantity > item.stock` mới không false-fail vì chính đơn này đang giữ hàng.
    if (needRevert) {
      await onRevertOrder(tx, orderBefore);
    }

    await updateOrderData(tx, actorId, orderBefore, updateReq);
    await updateOrderStatus(tx, orderId, updateReq);

    if (needConfirm) {
      await onConfirmOrder(tx, await getOrderById(tx, orderId));
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

// ghi toàn bộ data của order TRỪ status. Thuần data, không side effect - side effect do
// updateOrder quyết. Quy ước PATCH: undefined = giữ nguyên, null = xóa về null.
async function updateOrderData(db: DbExec, actorId: string, orderBefore: Order, updateReq: UpdateOrderRequest): Promise<void> {
  const orderId = orderBefore.id;

  const pricingChanged = isPricingChanged(updateReq);

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

    const calculation = await calculateOrder(db, {
      lines: effectiveLines,
      customerPhoneNum: effectivePhoneNum,
      couponCode: effectiveCouponCode,
      manualDiscountAmount: updateReq.manualDiscountAmount ?? orderBefore.manualDiscountAmount,
      manualShippingFee: updateReq.manualShippingFee ?? orderBefore.shippingAmount
    });

    // chỉ resolve lại couponId để gắn vào order; ghi usage là việc của onConfirmOrder
    const coupon = effectiveCouponCode ? await getCouponByCode(db, effectiveCouponCode) : null;

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

    // rebuild toàn bộ orderLines theo snapshot mới
    await db.delete(orderLines).where(eq(orderLines.orderId, orderId));
    await db.insert(orderLines).values(calculation.lines.map((line) => ({
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

  await db.update(orders).set({
    customerName: updateReq.customerName,
    customerEmail: updateReq.customerEmail,
    customerPhoneNum: updateReq.customerPhoneNum,
    customerAddress: updateReq.customerAddress,
    paymentMethod: updateReq.paymentMethod,
    paymentStatus: updateReq.paymentStatus,
    deliveryStatus: updateReq.deliveryStatus,
    channel: updateReq.channel,
    platformOrderId: updateReq.platformOrderId,
    platformCost: updateReq.platformCost,
    taxCost: updateReq.taxCost,
    shippingCost: updateReq.shippingCost,
    otherCost: updateReq.otherCost,
    referrerId: updateReq.referrerId,
    note: updateReq.note,
    createdAt: updateReq.createdAt,
    ...pricing
  }).where(eq(orders.id, orderId));

  // đồng bộ createdAt của các orderLines theo createdAt của order (nếu có cập nhật).
  // bỏ qua khi pricingChanged vì lines đã được rebuild với effectiveCreatedAt ở trên.
  if (updateReq.createdAt !== undefined && !pricingChanged) {
    await db.update(orderLines).set({
      createdAt: updateReq.createdAt
    }).where(eq(orderLines.orderId, orderId));
  }

  // đụng name/phone của customer -> hồi tố luôn vào bản ghi customers (nguồn sự thật).
  // customerId KHÔNG bao giờ đổi. email không sync (updateCustomer không nhận email +
  // email unique dễ đụng customer khác). phoneNum null (xóa trên order) -> bỏ qua.
  const customerSync: UpdateCustomerRequest = {};
  if (updateReq.customerName !== undefined) {
    customerSync.name = updateReq.customerName;
  }
  if (typeof updateReq.customerPhoneNum === "string") {
    customerSync.phoneNum = updateReq.customerPhoneNum;
  }
  if (Object.keys(customerSync).length > 0) {
    await updateCustomer(db, actorId, orderBefore.customerId, customerSync);
  }
}

// ghi mỗi cột status. Không transition nào bị cấm: status đi lại tự do giữa
// PENDING/CONFIRMED/CANCELLED, side effect đã do updateOrder quyết trước đó.
async function updateOrderStatus(db: DbExec, orderId: string, updateReq: UpdateOrderRequest): Promise<void> {
  if (updateReq.status === undefined) {
    return;
  }

  await db.update(orders).set({
    status: updateReq.status
  }).where(eq(orders.id, orderId));
}

// side effect khi đơn được CONFIRM: chạy đúng 1 lần lúc đơn chuyển sang status CONFIRMED
// (hoặc lúc create nếu status khởi tạo đã là CONFIRMED).
async function onConfirmOrder(db: DbExec, order: Order): Promise<void> {
  const lines = order.lines.flatMap((line) =>
    line.itemId !== null ? [{ itemId: line.itemId, quantity: line.quantity }] : []
  );

  // trừ stock + ghi transaction SOLD cho từng item trong đơn
  await soldItems(db, lines);

  // đánh dấu coupon đã dùng (chỉ khi đơn được confirm)
  if (order.couponId) {
    await applyCoupon(db, order.couponId, order.subtotalAmount, order.customerPhoneNum ?? "");
  }

  // +1 usedCount cho từng combo đã áp vào đơn (chỉ khi đơn được confirm)
  await incrementCombosUsage(db, order.combos.map((combo) => combo.id));

  // TODO: loyaltyPoints để dành cho feature riêng sau này
  await db.update(customers).set({
    totalSpent: sql`${customers.totalSpent} + ${order.totalAmount}`,
    totalOrders: sql`${customers.totalOrders} + 1`,
    lastOrderAt: new Date()
  }).where(eq(customers.id, order.customerId));
}

// nghịch đảo của onConfirmOrder: nhả lại toàn bộ side effect của đơn đã confirm.
// nhận snapshot TRƯỚC khi sửa, vì phải nhả đúng thứ đã áp (lines/coupon/total cũ).
async function onRevertOrder(db: DbExec, order: Order): Promise<void> {
  const lines = order.lines.flatMap((line) =>
    line.itemId !== null ? [{ itemId: line.itemId, quantity: line.quantity }] : []
  );

  // cộng lại stock + ghi transaction REFUND cho từng item trong đơn
  await refundItems(db, lines);

  // nhả lại lượt dùng của coupon
  if (order.couponId) {
    await revokeCoupon(db, order.couponId, order.customerPhoneNum ?? "");
  }

  // -1 usedCount cho từng combo đã áp vào đơn
  await decrementCombosUsage(db, order.combos.map((combo) => combo.id));

  // lastOrderAt KHÔNG revert: không lưu giá trị cũ ở đâu để khôi phục, chấp nhận lệch.
  await db.update(customers).set({
    totalSpent: sql`greatest(${customers.totalSpent} - ${order.totalAmount}, 0)`,
    totalOrders: sql`greatest(${customers.totalOrders} - 1, 0)`
  }).where(eq(customers.id, order.customerId));
}

// pure: PATCH có đụng vào input của khối tiền không. updateOrder dùng nó để quyết
// revert/confirm, updateOrderData dùng nó để quyết có chạy lại calculateOrder - hai chỗ
// bắt buộc phải trả cùng một kết quả nên chỉ định nghĩa một lần ở đây.
function isPricingChanged(updateReq: UpdateOrderRequest): boolean {
  return updateReq.lines !== undefined
    || updateReq.couponCode !== undefined
    || updateReq.manualDiscountAmount !== undefined
    || updateReq.manualShippingFee !== undefined;
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