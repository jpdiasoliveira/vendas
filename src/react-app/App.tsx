/**
 * Raiz da aplicação: apenas provê rotas e contextos globais.
 * Nenhuma lógica de negócio aqui; as páginas e hooks cuidam de estado e API.
 */
import type { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router";
import HomePage from "@/react-app/pages/Home";
import ProductPage from "@/react-app/pages/Product";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import OrdersPage from "@/react-app/pages/Orders";
import LoginPage from "@/react-app/pages/auth/Login";
import AdminOrdersPage from "@/react-app/pages/AdminOrders";
import AdminProductsPage from "@/react-app/pages/AdminProducts";
import AdminSettingsPage from "@/react-app/pages/AdminSettings";
import AdminCheckoutSettingsPage from "@/react-app/pages/AdminCheckoutSettings";
import AdminShippingFareBandsPage from "@/react-app/pages/AdminShippingFareBands";
import AdminCouponsPage from "@/react-app/pages/AdminCoupons";
import AdminNewsletterPage from "@/react-app/pages/AdminNewsletterPage";
import { AdminCatalogHubLayout } from "@/react-app/components/admin/AdminCatalogHubLayout";
import { AdminStoreHubLayout } from "@/react-app/components/admin/AdminStoreHubLayout";
import AuditLogsPage from "@/react-app/pages/admin/AuditLogs";
import { PlatformLayout } from "@/react-app/components/platform/layout/PlatformLayout";
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
import { AdminGuard } from "@/react-app/components/auth/AdminGuard";
import { AdminLayout } from "@/react-app/components/admin/AdminLayout";
import { queryClient } from "@/react-app/query/queryClient";
import { ToastProvider } from "@/react-app/providers/ToastProvider";
import { PageTransition } from "@/react-app/components/storefront/layout/PageTransition";
import { AlertCircle } from "lucide-react";

const isPlatformCentralPath = (pathname: string) => pathname.startsWith("/admin/platform");

const StoreBootGate = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { loading, error, refetch, settings } = useStoreSettings();
  const platformCentral = isPlatformCentralPath(pathname);

  if (loading) {
    if (platformCentral) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-center">
          <div>
            <p className="font-display text-2xl font-bold text-content">Central de gestão</p>
            <p className="mt-2 font-body text-sm text-content-muted">A preparar o painel da plataforma…</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-center">
        <div>
          <p className="font-display text-2xl font-bold text-content">
            {settings?.displayName?.trim() || "Carregando loja"}
          </p>
          <p className="mt-2 font-body text-sm text-content-muted">Preparando identidade da loja...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <AlertCircle className="h-12 w-12 text-accent" aria-hidden />
        <div className="max-w-md">
          <h1 className="font-display text-xl font-semibold text-content">
            {platformCentral ? "Não foi possível concluir o arranque" : "Não foi possível carregar a loja"}
          </h1>
          <p className="mt-2 font-body text-sm text-content-muted">{error}</p>
          {platformCentral ? (
            <p className="mt-3 font-body text-xs text-content-muted">
              Verifica a ligação à internet e se o serviço está disponível. Se o problema continuar, tenta de novo em
              instantes.
            </p>
          ) : (
            <p className="mt-3 font-body text-xs text-content-muted">
              Confira sua conexão, se o slug da loja está correto (ou o subdomínio) e se a API está no ar — em
              desenvolvimento: <code className="rounded bg-surface-muted px-1">wrangler dev</code> na porta 8787 com proxy{" "}
              <code className="rounded bg-surface-muted px-1">/api</code> no Vite.
            </p>
          )}
        </div>
        <button
          type="button"
          className="rounded-full bg-brand-primary px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-brand-primary-hover"
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
      <ToastProvider>
        <StoreSettingsProvider>
          <CartProvider>
            <Router>
              <AuthProvider>
                <StoreBootGate>
                  <PageTransition>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/produto/:slug" element={<ProductPage />} />
                      <Route path="/auth/callback" element={<AuthCallbackPage />} />
                      <Route path="/pedidos" element={<OrdersPage />} />
                      <Route path="/order/:orderId/confirmation" element={<OrderConfirmationPage />} />
                      <Route path="/pedido/acompanhar" element={<OrderPublicTrackPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/admin" element={<AdminGuard />}>
                        <Route element={<AdminLayout />}>
                          <Route path="pedidos" element={<AdminOrdersPage />} />
                          <Route path="produtos" element={<AdminCatalogHubLayout />}>
                            <Route index element={<Navigate to="/admin/produtos/catalogo" replace />} />
                            <Route path="catalogo" element={<AdminProductsPage />} />
                            <Route path="categorias" element={<AdminCategoriesPage />} />
                          </Route>
                          <Route path="categorias" element={<Navigate to="/admin/produtos/categorias" replace />} />
                          <Route path="loja" element={<AdminStoreHubLayout />}>
                            <Route index element={<Navigate to="/admin/loja/vitrine" replace />} />
                            <Route path="vitrine" element={<AdminSettingsPage />} />
                            <Route path="checkout" element={<AdminCheckoutSettingsPage />} />
                            <Route path="frete" element={<AdminShippingFareBandsPage />} />
                            <Route path="cupons" element={<AdminCouponsPage />} />
                            <Route path="newsletter" element={<AdminNewsletterPage />} />
                          </Route>
                          <Route path="configuracoes" element={<Navigate to="/admin/loja/vitrine" replace />} />
                          <Route path="checkout" element={<Navigate to="/admin/loja/checkout" replace />} />
                          <Route path="newsletter" element={<Navigate to="/admin/loja/newsletter" replace />} />
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
                        <Route
                          path="plataforma/nova-loja"
                          element={<Navigate to="/admin/platform/dashboard" replace />}
                        />
                      </Route>
                    </Routes>
                  </PageTransition>
                </StoreBootGate>
              </AuthProvider>
            </Router>
          </CartProvider>
        </StoreSettingsProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
