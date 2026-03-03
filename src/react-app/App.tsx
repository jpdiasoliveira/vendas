/**
 * Raiz da aplicação: apenas provê rotas e contextos globais.
 * Nenhuma lógica de negócio aqui; as páginas e hooks cuidam de estado e API.
 */
import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import OrdersPage from "@/react-app/pages/Orders";
import LoginPage from "@/react-app/pages/auth/Login";
import AdminOrdersPage from "@/react-app/pages/AdminOrders";
import AdminProductsPage from "@/react-app/pages/AdminProducts";
import AuditLogsPage from "@/react-app/pages/admin/AuditLogs";
import { CartProvider } from "@/react-app/contexts/CartContext";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { AuthProvider as MochaAuthProvider } from "@getmocha/users-service/react";
import { AdminGuard } from "@/react-app/components/auth/AdminGuard";

export default function App() {
  return (
    <MochaAuthProvider>
      <CartProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/pedidos" element={<OrdersPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminGuard />}>
                <Route path="pedidos" element={<AdminOrdersPage />} />
                <Route path="produtos" element={<AdminProductsPage />} />
                <Route path="historico" element={<AuditLogsPage />} />
              </Route>
            </Routes>
          </AuthProvider>
        </Router>
      </CartProvider>
    </MochaAuthProvider>
  );
}
