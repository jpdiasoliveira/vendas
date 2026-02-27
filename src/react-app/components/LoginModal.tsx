import { useAuth } from '@getmocha/users-service/react';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { redirectToLogin } = useAuth();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    await redirectToLogin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6D4C41] hover:text-[#1B4332] transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-3xl font-bold text-[#1B4332] font-playfair mb-2">Bem-vindo!</h2>
        <p className="text-[#6D4C41] mb-8 font-inter">Faça login para continuar com sua compra</p>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-[#1B4332]/20 text-[#1B4332] px-6 py-4 rounded-full font-medium hover:border-[#1B4332]/40 hover:shadow-lg transition-all duration-300 font-inter"
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1B4332]/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#6D4C41]">Outras opções em breve</span>
            </div>
          </div>

          <button
            disabled
            className="w-full flex items-center justify-center space-x-3 bg-[#6D4C41]/10 text-[#6D4C41]/50 px-6 py-4 rounded-full font-medium cursor-not-allowed font-inter"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.5 12c0-6.351-5.149-11.5-11.5-11.5S.5 5.649.5 12c0 5.737 4.208 10.491 9.719 11.358V15.27H7.094V12h3.125V9.356c0-3.084 1.836-4.786 4.644-4.786 1.345 0 2.751.24 2.751.24v3.027h-1.549c-1.526 0-2.002.947-2.002 1.918V12h3.406l-.545 3.27h-2.861v8.089C19.292 22.491 23.5 17.737 23.5 12" />
            </svg>
            <span>Microsoft (em breve)</span>
          </button>

          <button
            disabled
            className="w-full flex items-center justify-center space-x-3 bg-[#6D4C41]/10 text-[#6D4C41]/50 px-6 py-4 rounded-full font-medium cursor-not-allowed font-inter"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email/Senha (em breve)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
