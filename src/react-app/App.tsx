/**
 * Raiz da aplicação: apenas provê rotas e contextos globais.
 * Nenhuma lógica de negócio aqui; as páginas e hooks cuidam de estado e API.
 */
import type { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import OrdersPage from "@/react-app/pages/Orders";
import LoginPage from "@/react-app/pages/auth/Login";
import AdminOrdersPage from "@/react-app/pages/AdminOrders";
import AdminProductsPage from "@/react-app/pages/AdminProducts";
import AdminSettingsPage from "@/react-app/pages/AdminSettings";
import AuditLogsPage from "@/react-app/pages/admin/AuditLogs";
import { PlatformLayout } from "@/react-app/components/admin/PlatformLayout";
import PlatformDashboardPage from "@/react-app/pages/admin/platform/PlatformDashboardPage";
import PlatformStoresPage from "@/react-app/pages/admin/platform/PlatformStoresPage";
import PlatformPlansPage from "@/react-app/pages/admin/platform/PlatformPlansPage";
import PlatformSettingsPage from "@/react-app/pages/admin/platform/PlatformSettingsPage";
import OrderConfirmationPage from "@/react-app/pages/OrderConfirmation";
import OrderPublicTrackPage from "@/react-app/pages/OrderPublicTrackPage";
import AdminCategoriesPage from "@/react-app/pages/AdminCategories";
import { QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/react-app/contexts/CartContext";
import { StoreSettingsProvider, useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { AuthProvider as MochaAuthProvider } from "@getmocha/users-service/react";
import { AdminGuard } from "@/react-app/components/auth/AdminGuard";
import { AdminLayout } from "@/react-app/components/admin/AdminLayout";
import { queryClient } from "@/react-app/query/queryClient";
import { AlertCircle } from "lucide-react";

const isPlatformCentralPath = (pathname: string) => pathname.startsWith("/admin/platform");

const StoreBootGate = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { loading, error, refetch, settings } = useStoreSettings();
  const platformCentral = isPlatformCentralPath(pathname);

  if (loading) {
    if (platformCentral) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 text-center">
          <div>
            <p className="font-playfair text-2xl font-bold text-slate-800">Central de gestão</p>
            <p className="mt-2 font-inter text-sm text-slate-600">A preparar o painel da plataforma…</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 text-center">
        <div>
          <p className="font-playfair text-2xl font-bold text-slate-800">
            {settings?.displayName?.trim() || "Carregando loja"}
          </p>
          <p className="mt-2 font-inter text-sm text-slate-600">Preparando identidade da loja...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 text-center">
        <AlertCircle className="h-12 w-12 text-amber-600" aria-hidden />
        <div className="max-w-md">
          <h1 className="font-playfair text-xl font-semibold text-slate-800">
            {platformCentral ? "Não foi possível concluir o arranque" : "Não foi possível carregar a loja"}
          </h1>
          <p className="mt-2 font-inter text-sm text-slate-600">{error}</p>
          {platformCentral ? (
            <p className="mt-3 font-inter text-xs text-slate-500">
              Verifica a ligação à internet e se o serviço está disponível. Se o problema continuar, tenta de novo em
              instantes.
            </p>
          ) : (
            <p className="mt-3 font-inter text-xs text-slate-500">
              Confira sua conexão, se o slug da loja está correto (ou o subdomínio) e se a API está no ar — em
              desenvolvimento: <code className="rounded bg-slate-200 px-1">wrangler dev</code> na porta 8787 com proxy{" "}
              <code className="rounded bg-slate-200 px-1">/api</code> no Vite.
            </p>
          )}
        </div>
        <button
          type="button"
          className="rounded-full bg-slate-800 px-6 py-2.5 font-inter text-sm font-medium text-white transition hover:bg-slate-900"
          onClick={() => void refetch()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MochaAuthProvider>
        <StoreSettingsProvider>
          <CartProvider>
            <Router>
              <AuthProvider>
                <StoreBootGate>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/pedidos" element={<OrdersPage />} />
                    <Route path="/order/:orderId/confirmation" element={<OrderConfirmationPage />} />
                    <Route path="/pedido/acompanhar" element={<OrderPublicTrackPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin" element={<AdminGuard />}>
                      <Route element={<AdminLayout />}>
                        <Route path="pedidos" element={<AdminOrdersPage />} />
                        <Route path="produtos" element={<AdminProductsPage />} />
                        <Route path="categorias" element={<AdminCategoriesPage />} />
                        <Route path="configuracoes" element={<AdminSettingsPage />} />
                        <Route path="historico" element={<AuditLogsPage />} />
                      </Route>
                      <Route path="platform" element={<PlatformLayout />}>
                        <Route index element={<Navigate to="/admin/platform/dashboard" replace />} />
                        <Route path="dashboard" element={<PlatformDashboardPage />} />
                        <Route path="lojas" element={<PlatformStoresPage />} />
                        <Route path="planos" element={<PlatformPlansPage />} />
                        <Route path="configuracoes" element={<PlatformSettingsPage />} />
                      </Route>
                      <Route path="plataforma" element={<Navigate to="/admin/platform/dashboard" replace />} />
                      <Route path="plataforma/nova-loja" element={<Navigate to="/admin/platform/dashboard" replace />} />
                    </Route>
                  </Routes>
                </StoreBootGate>
              </AuthProvider>
            </Router>
          </CartProvider>
        </StoreSettingsProvider>
      </MochaAuthProvider>
    </QueryClientProvider>
  );
}
