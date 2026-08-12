import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { PlatformShellProvider, usePlatformShell } from "@/react-app/contexts/PlatformShellContext";
import { PlatformSidebar } from "@/react-app/components/platform/layout/PlatformSidebar";
import { PlatformTopbar } from "@/react-app/components/platform/layout/PlatformTopbar";
import { PlatformNewStoreModal } from "@/react-app/components/platform/stores/PlatformNewStoreModal";
import LogoutConfirmModal from "@/react-app/components/LogoutConfirmModal";
import { clearStoreSlugOverride, getStoreSlugOverride } from "@/react-app/services/api";
import { isPlatformOperatorEmail } from "@/react-app/utils/platformOperator";

const PlatformLayoutInner = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const allowed = isPlatformOperatorEmail(user?.email);
  const { newStoreModalOpen, setNewStoreModalOpen, notifyStoresListChanged } = usePlatformShell();
  const [overrideSlug, setOverrideSlug] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user && !allowed) navigate("/admin/pedidos", { replace: true });
  }, [loading, user, allowed, navigate]);

  useEffect(() => {
    setOverrideSlug(getStoreSlugOverride());
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-content-muted">Carregando…</p>
      </div>
    );
  }

  if (!allowed) return null;

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-surface text-content">
      <PlatformSidebar
        operatorEmail={user.email?.trim() || null}
        onNewStore={() => setNewStoreModalOpen(true)}
        onLogoutClick={() => setShowLogoutModal(true)}
      />
      <div className="flex min-w-0 flex-1 flex-col pl-[260px]">
        <PlatformTopbar
          storeOverrideSlug={overrideSlug}
          onClearStoreOverride={() => {
            clearStoreSlugOverride();
            setOverrideSlug(null);
          }}
        />
        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <PlatformNewStoreModal
        isOpen={newStoreModalOpen}
        onClose={() => setNewStoreModalOpen(false)}
        onCreated={() => notifyStoresListChanged()}
      />
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export const PlatformLayout = () => (
  <PlatformShellProvider>
    <PlatformLayoutInner />
  </PlatformShellProvider>
);
