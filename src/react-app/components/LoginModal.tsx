import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { Mail, X } from "lucide-react";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const navigate = useNavigate();
  const { redirectToLogin } = useAuth();

  if (!isOpen) return null;

  const goEmailLogin = () => {
    onClose();
    navigate("/login?next=" + encodeURIComponent("/"));
  };

  const handleGoogleLogin = async () => {
    await redirectToLogin();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative max-w-md w-full rounded-3xl border border-white/50 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[#6D4C41] transition-colors hover:text-[#1B4332]"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="mb-2 font-playfair text-3xl font-bold text-[#1B4332]">Bem-vindo!</h2>
        <p className="mb-8 font-inter text-[#6D4C41]">Entre para finalizar a compra com seus pedidos salvos na conta.</p>

        <div className="space-y-4">
          <button
            type="button"
            onClick={goEmailLogin}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1B4332]/20 bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] px-6 py-4 font-inter font-medium text-white transition-all hover:shadow-lg"
          >
            <Mail className="h-5 w-5 shrink-0" />
            <span>Entrar com e-mail e senha</span>
          </button>

          <p className="text-center font-inter text-xs text-[#6D4C41]/80">ou</p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center space-x-3 rounded-full border-2 border-[#1B4332]/20 bg-white px-6 py-4 font-inter font-medium text-[#1B4332] transition-all hover:border-[#1B4332]/40 hover:shadow-lg"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continuar com Google</span>
          </button>

          <p className="pt-1 text-center font-inter text-xs leading-relaxed text-[#6D4C41]/70">
            O Google usa outro fluxo de sessão; para unificar com o painel e os pedidos, prefira e-mail e senha.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
