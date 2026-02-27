import { useState, useEffect } from 'react';
import { X, Copy, Check, Loader2 } from 'lucide-react';
import { useCheckout } from '@/react-app/hooks/useCheckout';

interface PixPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: number;
    qrCode: string;
    qrCodeBase64: string;
}

export default function PixPaymentModal({ isOpen, onClose, orderId, qrCode, qrCodeBase64 }: PixPaymentModalProps) {
    const [copied, setCopied] = useState(false);
    const { checkPaymentStatus, isProcessing } = useCheckout();

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);

    if (!isOpen) return null;

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const verifyStatus = async () => {
        try {
            const order = await checkPaymentStatus(orderId);
            if (order.payment_status === 'approved') {
                alert('Pagamento aprovado!');
                onClose();
                window.location.reload();
            } else {
                alert('Pagamento ainda não foi processado. Tente novamente em alguns instantes.');
            }
        } catch (error) {
            // O erro já é lidado no console via useCheckout
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-white/50 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#6D4C41] hover:text-[#1B4332] transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="text-center">
                    <h2 className="text-3xl font-bold text-[#1B4332] font-playfair mb-4">Pague com Pix</h2>
                    <p className="text-[#6D4C41] mb-6 font-inter">Escaneie o QR Code abaixo ou copie o código Pix</p>

                    <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 inline-block">
                        <img
                            src={`data:image/png;base64,${qrCodeBase64}`}
                            alt="QR Code Pix"
                            className="w-64 h-64 mx-auto"
                        />
                    </div>

                    <div className="bg-[#1B4332]/5 p-4 rounded-2xl mb-6">
                        <p className="text-sm text-[#6D4C41] font-inter mb-2">Código Pix Copia e Cola:</p>
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={qrCode}
                                readOnly
                                className="flex-1 bg-white/60 border border-[#1B4332]/20 rounded-xl px-4 py-2 text-sm text-[#1B4332] font-mono"
                            />
                            <button
                                onClick={() => handleCopy(qrCode)}
                                className="bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-4 py-2 rounded-xl font-bold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                            >
                                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={verifyStatus}
                        disabled={isProcessing}
                        className="w-full bg-[#1B4332] text-white py-3 rounded-full font-bold hover:bg-[#2d5a4a] transition-all duration-300 font-inter mb-4 flex items-center justify-center space-x-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Verificando...</span>
                            </>
                        ) : (
                            <span>Já paguei - Verificar Status</span>
                        )}
                    </button>

                    <p className="text-xs text-[#6D4C41]/70 font-inter">
                        Após o pagamento, a confirmação pode levar alguns instantes
                    </p>
                </div>
            </div>
        </div>
    );
}
