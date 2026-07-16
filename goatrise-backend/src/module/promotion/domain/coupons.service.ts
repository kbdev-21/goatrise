import type { DbExec } from "../../../core/db.js";
import { coupons } from "../schema/coupons.schema.js";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import { computeCouponDiscount } from "./coupon-calculation.service.js";
import type { CreateCouponRequest, FindCouponsQuery } from "./validators.js";
import type { Coupon } from "./types.js";

export async function getCouponById(db: DbExec, id: string): Promise<Coupon> {
  const coupon = await db.query.coupons.findFirst({
    where: {
      id: id
    }
  });

  if (!coupon) {
    throw new HTTPException(404, { message: "Coupon not found" });
  }

  return coupon;
}

export async function getCouponByCode(db: DbExec, code: string): Promise<Coupon> {
  const coupon = await db.query.coupons.findFirst({
    where: {
      code: code
    }
  });

  if (!coupon) {
    throw new HTTPException(404, { message: "Coupon not found" });
  }

  return coupon;
}

export async function findCoupons(db: DbExec, query: FindCouponsQuery): Promise<Coupon[]> {
  const { search, isOutOfUse, sort, offset, limit } = query;
  const [sortField, sortDirection] = sort.split(":");
  const direction: "asc" | "desc" = sortDirection?.toLowerCase() === "asc" ? "asc" : "desc";

  return await db.query.coupons.findMany({
    where: {
      ...(search ? {
        OR: [
          { RAW: (t, { sql }) => sql`${t.id}::text ilike ${`%${search}%`}` },
          { code: { ilike: `%${search}%` } }
        ]
      } : {}),
      ...(isOutOfUse !== undefined ? { isOutOfUse: isOutOfUse } : {})
    },
    offset: offset,
    limit: limit,
    orderBy: { [sortField]: direction }
  });
}

export async function createCoupon(db: DbExec, actorId: string, createReq: CreateCouponRequest): Promise<Coupon> {
  const newCouponId = uuidv7();

  return await db.transaction(async (tx) => {
    await tx.insert(coupons).values({
      id: newCouponId,
      code: createReq.code,
      discountType: createReq.discountType,
      discountValue: createReq.discountValue,
      minAppliablePrice: createReq.minAppliablePrice,
      maxDiscountAmount: createReq.maxDiscountAmount ?? null,
      maximalUsage: createReq.maximalUsage,
      startsAt: createReq.startsAt,
      expiresAt: createReq.expiresAt ?? null
    });

    const newCoupon = await getCouponById(tx, newCouponId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "coupon-create",
      referenceType: "coupon",
      referenceId: newCouponId,
      metadata: {
        coupon: newCoupon
      }
    });

    return newCoupon;
  });
}

// đánh dấu coupon đã được dùng (tăng usedCount + ghi phone). Không tự mở transaction
// để compose được vào transaction của caller (vd onCompleteOrder). Truyền tx khi cần atomic.
export async function applyCoupon(db: DbExec, couponId: string, orderSubtotal: number, orderPhoneNum: string): Promise<Coupon> {
  const coupon = await getCouponById(db, couponId);

  const discount = computeCouponDiscount(coupon, orderSubtotal, orderPhoneNum);
  if (discount === false) {
    throw new HTTPException(400, { message: "Coupon not applicable" });
  }

  const [updated] = await db
    .update(coupons)
    .set({
      usedCount: coupon.usedCount + 1,
      usedPhoneNums: [...coupon.usedPhoneNums, orderPhoneNum]
    })
    .where(eq(coupons.id, coupon.id))
    .returning();

  return updated;
}
