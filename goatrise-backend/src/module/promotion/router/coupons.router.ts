import { Hono } from "hono";
import { authMiddleware } from "../../auth/middleware/auth.middleware.js";
import { requiredRolesMiddleware } from "../../auth/middleware/required-roles.middleware.js";
import type { ContextVariables } from "../../../core/types.js";
import { db } from "../../../core/db.js";
import { createCoupon, findCoupons, getCouponById } from "../domain/coupons.service.js";
import { zValidator } from "@hono/zod-validator";
import { CreateCouponRequestSchema, FindCouponsQuerySchema } from "../domain/validators.js";

export const couponsRouter = new Hono<{ Variables: ContextVariables }>();

couponsRouter.get("/api/coupons",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("query", FindCouponsQuerySchema),
  async (c) => {
    const query = c.req.valid("query");

    const coupons = await findCoupons(db, query);

    return c.json(coupons);
  }
);

couponsRouter.get("/api/coupons/:id",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  async (c) => {
    const couponId = c.req.param("id");

    const coupon = await getCouponById(db, couponId);

    return c.json(coupon);
  }
);

couponsRouter.post("/api/coupons",
  authMiddleware,
  requiredRolesMiddleware(["ADMIN", "STAFF"]),
  zValidator("json", CreateCouponRequestSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    const createReq = c.req.valid("json");

    const newCoupon = await createCoupon(db, currentUser.id, createReq);

    return c.json(newCoupon, 201);
  }
);
