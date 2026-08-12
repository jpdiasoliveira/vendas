import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import LogoutConfirmModal from "@/react-app/components/LogoutConfirmModal";
import { AdminNavDrawer } from "@/react-app/components/admin/AdminNavDrawer";
import { useAdminNav } from "@/react-app/hooks/admin/useAdminNav";

type AdminNavProps = {
  children?: ReactNode;
};

export const AdminNav = ({ children }: AdminNavProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { links, pathActive, storeName, logoUrl, adminLogoPx, markInitial } = useAdminNav();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const linkClass = (isActive: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
      isActive
        ? "bg-brand-primary/12 text-brand-primary ring-1 ring-brand-primary/20"
        : "text-content-muted hover:bg-surface-muted hover:text-content"
    }`;

  return (
    <>
      <nav className="flex w-full min-w-0 items-center gap-2 sm:gap-3" aria-label="Painel administrativo">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 text-content-muted transition hover:bg-surface-muted hover:text-content lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          to="/"
          className="flex min-w-0 max-w-[42%] shrink-0 items-center gap-2 rounded-lg px-1 py-0.5 outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand-primary/25 sm:max-w-[min(16rem,38%)]"
          aria-label={`Abrir vitrine — ${storeName}`}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              style={{ height: `${adminLogoPx}px`, width: "auto" }}
              className="max-h-11 w-auto shrink-0 rounded-md object-contain"
            />
          ) : (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/12 text-[0.7rem] font-bold tabular-nums text-brand-primary ring-1 ring-brand-primary/18"
              aria-hidden
            >
              {markInitial}
            </span>
          )}
          <span className="min-w-0 truncate font-display text-base font-semibold leading-tight text-content sm:text-lg">
            {storeName}
          </span>
        </Link>

        <div
          className="hidden min-w-0 flex-1 overflow-x-auto lg:block [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Seções do painel"
        >
          <div className="flex min-h-[2.25rem] items-center justify-center gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const isActive = pathActive(to);
              return (
                <Link key={to} to={to} className={linkClass(isActive)} role="tab" aria-selected={isActive}>
                  <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {children}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/15 bg-surface-elevated px-2.5 py-1.5 text-[13px] font-medium text-content-muted transition hover:bg-surface-muted hover:text-content"
            aria-label="Sair do painel"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </nav>

      <AdminNavDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        links={links}
        pathActive={pathActive}
        onLogout={() => setShowLogoutModal(true)}
      />

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};
