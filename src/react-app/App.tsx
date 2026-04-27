/**
 * Raiz da aplicação: apenas provê rotas e contextos globais.
 * Nenhuma lógica de negócio aqui; as páginas e hooks cuidam de estado e API.
 */
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
import { CartProvider } from "@/react-app/contexts/CartContext";
import { StoreSettingsProvider } from "@/react-app/contexts/StoreSettingsContext";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { AuthProvider as MochaAuthProvider } from "@getmocha/users-service/react";
import { AdminGuard } from "@/react-app/components/auth/AdminGuard";

export default function App() {
  return (
    <MochaAuthProvider>
      <StoreSettingsProvider>
        <CartProvider>
          <Router>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/pedidos" element={<OrdersPage />} />
                <Route path="/order/:orderId/confirmation" element={<OrderConfirmationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<AdminGuard />}>
                  <Route path="pedidos" element={<AdminOrdersPage />} />
                  <Route path="produtos" element={<AdminProductsPage />} />
                  <Route path="configuracoes" element={<AdminSettingsPage />} />
                  <Route path="historico" element={<AuditLogsPage />} />
                  <Route path="plataforma" element={<PlatformPage />} />
                  <Route path="plataforma/nova-loja" element={<Navigate to="/admin/plataforma" replace />} />
                </Route>
              </Routes>
            </AuthProvider>
          </Router>
        </CartProvider>
      </StoreSettingsProvider>
    </MochaAuthProvider>
  );
}
