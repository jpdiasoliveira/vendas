import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import OrdersPage from "@/react-app/pages/Orders";
import LoginPage from "@/react-app/pages/auth/Login";
import AdminOrdersPage from "@/react-app/pages/AdminOrders";
import AdminProductsPage from "@/react-app/pages/AdminProducts";
import { CartProvider } from "@/react-app/contexts/CartContext";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { AuthProvider as MochaAuthProvider } from "@getmocha/users-service/react";
import { AdminGuard } from "@/react-app/components/auth/AdminGuard";

export default function App() {
  return (
    <MochaAuthProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/pedidos" element={<OrdersPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminGuard />}>
              <Route path="pedidos" element={<AdminOrdersPage />} />
              <Route path="produtos" element={<AdminProductsPage />} />
            </Route>
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </MochaAuthProvider>
  );
}
