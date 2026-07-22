import { useEffect } from "react"
import { Route, Routes } from "react-router-dom"

import { useAuthStore } from "@/stores/auth.store.ts"
import { Toaster } from "@/components/ui/sonner.tsx"
import PageLayout from "@/components/layout/PageLayout.tsx"
import LoginPage from "@/pages/login/LoginPage.tsx"
import HomePage from "@/pages/home/HomePage.tsx"
import UsersPage from "@/pages/users/UsersPage.tsx"
import AuditLogsPage from "@/pages/audit-logs/AuditLogsPage.tsx"
import ItemsPage from "@/pages/items/ItemsPage.tsx"
import CreateItemPage from "@/pages/items/CreateItemPage.tsx"
import ItemDetailPage from "@/pages/items/ItemDetailPage.tsx"
import ProductsPage from "@/pages/products/ProductsPage.tsx"
import CreateProductPage from "@/pages/products/CreateProductPage.tsx"
import ProductDetailPage from "@/pages/products/ProductDetailPage.tsx"
import CollectionsPage from "@/pages/collections/CollectionsPage.tsx"
import CreateCollectionPage from "@/pages/collections/CreateCollectionPage.tsx"
import CollectionDetailPage from "@/pages/collections/CollectionDetailPage.tsx"
import OrdersPage from "@/pages/orders/OrdersPage.tsx"
import CreateOrderPage from "@/pages/orders/CreateOrderPage.tsx"
import OrderDetailPage from "@/pages/orders/OrderDetailPage.tsx"
import CouponsPage from "@/pages/coupons/CouponsPage.tsx"
import CombosPage from "@/pages/combos/CombosPage.tsx"
import CustomersPage from "@/pages/customers/CustomersPage.tsx"
import SuppliersPage from "@/pages/suppliers/SuppliersPage.tsx"

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
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/create" element={<CreateProductPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/create" element={<CreateCollectionPage />} />
          <Route path="/collections/:id" element={<CollectionDetailPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/items/create" element={<CreateItemPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/create" element={<CreateOrderPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/combos" element={<CombosPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App
