import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth.store.ts";

// Trang login: đã có session -> rời /login về trang chính.
// Đợi isReady để không điều hướng nhầm trong lúc session còn đang load.
export function useRedirectGuestRoute() {
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const isReady = useAuthStore((s) => s.isReady);

  useEffect(() => {
    if (isReady && session) {
      navigate("/", { replace: true });
    }
  }, [isReady, session, navigate]);
}
