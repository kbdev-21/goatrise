import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { auth } from "@/core/auth";

type AuthState = {
  session: Session | null;
  // false: chưa xác định được session (đang load); true: đã biết chắc (đăng nhập hoặc chưa)
  isReady: boolean;
  init: () => () => void;
};

let unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isReady: false,
  init: () => {
    // idempotent: nếu đã init rồi thì tái sử dụng subscription cũ
    if (unsubscribe) {
      return unsubscribe;
    }

    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      set({ session, isReady: true });
    });

    unsubscribe = () => {
      subscription.unsubscribe();
      unsubscribe = null;
    };
    return unsubscribe;
  },
}));
