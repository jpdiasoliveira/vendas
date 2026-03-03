import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Loader2, CheckCircle } from 'lucide-react';
import { useCheckout } from '@/react-app/hooks/useCheckout';
import { apiFetch } from "@/react-app/services/api";

interface PixPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    qrCode: string;
    qrCodeBase64: string;
}

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 24;

export default function PixPaymentModal({ isOpen, onClose, orderId, qrCode, qrCodeBase64 }: PixPaymentModalProps) {
    const [copied, setCopied] = useState(false);
    const [paymentApproved, setPaymentApproved] = useState(false);
    const { checkPaymentStatus, isProcessing } = useCheckout();
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (copied) {
            const t = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(t);
        }
    }, [copied]);

    useEffect(() => {
        if (!isOpen || !orderId) return;
        setPaymentApproved(false);

        let attempts = 0;
        const poll = async () => {
            attempts += 1;
            if (attempts > POLL_MAX_ATTEMPTS) {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                return;
            }
            try {
                const order = await apiFetch<{ paymentStatus?: string }>(`/api/orders/${orderId}`);
                if (order.paymentStatus === 'approved') {
                    setPaymentApproved(true);
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                }
            } catch {
                // ignore
            }
        };

        pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
        poll();

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        };
    }, [isOpen, orderId]);

    if (!isOpen) return null;

    const handleCopy = async (text: string) => {
        if (!text) return;
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
            if (order.paymentStatus === 'approved') {
                setPaymentApproved(true);
            } else {
                alert('Pagamento ainda não foi processado. Tente novamente em alguns instantes.');
            }
        } catch {
            // erro já tratado no hook
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

                    {paymentApproved ? (
                        <div className="py-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <p className="text-xl font-bold text-[#1B4332] font-playfair mb-2">Pagamento aprovado!</p>
                            <p className="text-[#6D4C41] font-inter mb-6">Obrigado pela sua compra.</p>
                            <button
                                onClick={onClose}
                                className="bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-6 py-3 rounded-full font-bold font-inter"
                            >
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-[#6D4C41] mb-6 font-inter">Escaneie o QR Code abaixo ou use o Copia e Cola</p>

                            {qrCodeBase64 && (
                                <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 inline-block">
                                    <img
                                        src={`data:image/png;base64,${qrCodeBase64}`}
                                        alt="QR Code Pix"
                                        className="w-64 h-64 mx-auto"
                                    />
                                </div>
                            )}

                            {qrCode && (
                                <div className="bg-[#1B4332]/5 p-4 rounded-2xl mb-6">
                                    <p className="text-sm text-[#6D4C41] font-inter mb-2">Código Pix Copia e Cola:</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={qrCode}
                                            readOnly
                                            className="flex-1 bg-white/60 border border-[#1B4332]/20 rounded-xl px-4 py-2 text-sm text-[#1B4332] font-mono"
                                        />
                                        <button
                                            onClick={() => handleCopy(qrCode)}
                                            className="bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-4 py-2 rounded-xl font-bold hover:shadow-lg transition-all duration-300 flex items-center gap-2 shrink-0"
                                        >
                                            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={verifyStatus}
                                disabled={isProcessing}
                                className="w-full bg-[#1B4332] text-white py-3 rounded-full font-bold hover:bg-[#2d5a4a] transition-all duration-300 font-inter mb-4 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Verificando...</span>
                                    </>
                                ) : (
                                    <span>Já paguei — Verificar status</span>
                                )}
                            </button>

                            <p className="text-xs text-[#6D4C41]/70 font-inter">
                                A confirmação é verificada automaticamente a cada 5s ou ao clicar em &quot;Já paguei&quot;.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
