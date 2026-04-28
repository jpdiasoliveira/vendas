/**
 * Raiz da aplicação: apenas provê rotas e contextos globais.
 * Nenhuma lógica de negócio aqui; as páginas e hooks cuidam de estado e API.
 */
import type { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import OrdersPage from "@/react-app/pages/Orders";
import LoginPage from "@/react-app/pages/auth/Login";
import AdminOrdersPage from "@/react-app/pages/AdminOrders";
import AdminProductsPage from "@/react-app/pages/AdminProducts";
import AdminSettingsPage from "@/react-app/pages/AdminSettings";
import AuditLogsPage from "@/react-app/pages/admin/AuditLogs";
import PlatformPage from "@/react-app/pages/admin/PlatformPage";
import OrderConfirmationPage from "@/react-app/pages/OrderConfirmation";
import OrderPublicTrackPage from "@/react-app/pages/OrderPublicTrackPage";
import AdminCategoriesPage from "@/react-app/pages/AdminCategories";
import { CartProvider } from "@/react-app/contexts/CartContext";
import { StoreSettingsProvider, useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { AuthProvider as MochaAuthProvider } from "@getmocha/users-service/react";
import { AdminGuard } from "@/react-app/components/auth/AdminGuard";

function StoreBootGate({ children }: { children: ReactNode }) {
  const { loading, settings } = useStoreSettings();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] px-6 text-center">
        <div>
          <p className="font-playfair text-2xl font-bold text-[#1B4332]">
            {settings?.displayName?.trim() || "Carregando loja"}
          </p>
          <p className="mt-2 font-inter text-sm text-[#6D4C41]">Preparando identidade da loja...</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <MochaAuthProvider>
      <StoreSettingsProvider>
        <StoreBootGate>
          <CartProvider>
            <Router>
              <AuthProvider>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/pedidos" element={<OrdersPage />} />
                  <Route path="/order/:orderId/confirmation" element={<OrderConfirmationPage />} />
                  <Route path="/pedido/acompanhar" element={<OrderPublicTrackPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin" element={<AdminGuard />}>
                    <Route path="pedidos" element={<AdminOrdersPage />} />
                    <Route path="produtos" element={<AdminProductsPage />} />
                    <Route path="categorias" element={<AdminCategoriesPage />} />
                    <Route path="configuracoes" element={<AdminSettingsPage />} />
                    <Route path="historico" element={<AuditLogsPage />} />
                    <Route path="plataforma" element={<PlatformPage />} />
                    <Route path="plataforma/nova-loja" element={<Navigate to="/admin/plataforma" replace />} />
                  </Route>
                </Routes>
              </AuthProvider>
            </Router>
          </CartProvider>
        </StoreBootGate>
      </StoreSettingsProvider>
    </MochaAuthProvider>
  );
}
