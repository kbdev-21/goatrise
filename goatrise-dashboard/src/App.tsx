import { useEffect } from "react"
import { Route, Routes } from "react-router-dom"

import { useAuthStore } from "@/stores/auth.store.ts"
import { Toaster } from "@/components/ui/sonner.tsx"
import PageLayout from "@/components/layout/PageLayout.tsx"
import LoginPage from "@/pages/login/LoginPage.tsx"
import HomePage from "@/pages/home/HomePage.tsx"
import UsersPage from "@/pages/users/UsersPage.tsx"
import AuditLogsPage from "@/pages/audit-logs/AuditLogsPage.tsx"

export function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PageLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App
