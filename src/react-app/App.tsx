import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import OrdersPage from "@/react-app/pages/Orders";
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
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
