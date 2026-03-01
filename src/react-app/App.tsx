import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import OrdersPage from "@/react-app/pages/Orders";
import AdminOrdersPage from "@/react-app/pages/AdminOrders";
import AdminProductsPage from "@/react-app/pages/AdminProducts";
import { CartProvider } from "@/react-app/contexts/CartContext";
import { AuthProvider } from "@getmocha/users-service/react";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/pedidos" element={<OrdersPage />} />
            <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
            <Route path="/admin/produtos" element={<AdminProductsPage />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
