import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useOrders } from "@/react-app/hooks/useOrders";
import { useToast } from "@/react-app/providers/ToastProvider";
import { useOrderPayment } from "@/react-app/hooks/account/useOrderPayment";

export function useOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { orders, loading: ordersLoading, error, refreshOrders } = useOrders(!authLoading && !!user);
  const payment = useOrderPayment(() => void refreshOrders());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?next=${encodeURIComponent("/pedidos")}`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (error) {
      showToast({ type: "error", message: error });
    }
  }, [error, showToast]);

  return {
    user,
    authLoading,
    orders,
    ordersLoading,
    refreshOrders,
    payment,
  };
}
