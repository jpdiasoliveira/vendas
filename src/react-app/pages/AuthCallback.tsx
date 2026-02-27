import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        navigate('/');
      } catch (err) {
        console.error('Authentication failed:', err);
        setError('Falha na autenticação. Por favor, tente novamente.');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-6 py-3 rounded-full font-bold hover:shadow-xl transition-all duration-300"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/50 shadow-2xl text-center">
        <Loader2 className="h-12 w-12 text-[#1B4332] animate-spin mx-auto mb-4" />
        <p className="text-[#1B4332] font-inter text-lg">Autenticando...</p>
      </div>
    </div>
  );
}
