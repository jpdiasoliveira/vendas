import { X } from "lucide-react";
import { LoginForm } from "@/react-app/components/auth/LoginForm";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar login"
        className="absolute inset-0 bg-surface/75 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Entrar na conta"
        className="relative w-full max-w-md rounded-3xl border border-brand-primary/15 bg-surface-elevated p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-content-muted transition hover:bg-surface-muted hover:text-content"
          aria-label="Fechar"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="mb-2 pr-8 font-display text-2xl font-bold text-content">Bem-vindo!</h2>
        <p className="mb-8 font-body text-sm text-content-muted">
          Entre com e-mail e senha para finalizar a compra com seus pedidos salvos na conta.
        </p>

        <LoginForm onSuccess={onClose} redirectTo="/" />
      </div>
    </div>
  );
}

export default LoginModal;
