import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { auth } from "@/core/auth.ts";
import { useAuthStore } from "@/stores/auth.store.ts";
import { useMe } from "@/api/user/query-hooks.ts";
import type { UserRole } from "@/api/user/api.ts";

const ALLOWED_ROLES: UserRole[] = ["ADMIN", "STAFF"];

// Guard gộp cho khu cần đăng nhập:
// (1) chưa có session -> /login.
// (2) có session nhưng role không thuộc ADMIN/STAFF -> logout + /login + toast.
// Vì dashboard chỉ dành cho STAFF trở lên nên "qua auth" cũng chính là "đủ role".
export function useRedirectProtectedRoute() {
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const isReady = useAuthStore((s) => s.isReady);
  const query = useMe();
  const role = query.data?.role;

  // (1) chưa đăng nhập (đợi isReady để không đá nhầm lúc session đang load)
  useEffect(() => {
    if (isReady && !session) {
      navigate("/login", { replace: true });
    }
  }, [isReady, session, navigate]);

  // (2) đăng nhập rồi nhưng role không đủ
  useEffect(() => {
    if (role && !ALLOWED_ROLES.includes(role)) {
      // await signOut trước: clear session xong mới điều hướng,
      // tránh LoginPage tưởng còn đăng nhập rồi đá ngược về "/".
      void (async () => {
        await auth.signOut();
        navigate("/login", { replace: true });
        toast.error("Bạn không được phép truy cập app");
      })();
    }
  }, [role, navigate]);

  return query;
}
