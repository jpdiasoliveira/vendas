import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router';
import { X, Copy, Check, Loader2, CheckCircle } from 'lucide-react';
import { useCheckout } from '@/react-app/hooks/useCheckout';
import { apiFetch } from "@/react-app/services/api";

interface PixPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    qrCode: string;
    qrCodeBase64: string;
    guestCheckoutEmail?: string | null;
}

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 24;

export default function PixPaymentModal({
    isOpen,
    onClose,
    orderId,
    qrCode,
    qrCodeBase64,
    guestCheckoutEmail,
}: PixPaymentModalProps) {
    const [copied, setCopied] = useState(false);
    const [paymentApproved, setPaymentApproved] = useState(false);
    const { checkPaymentStatus, isProcessing } = useCheckout();
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const confirmationHref = useMemo(() => {
        const path = `/order/${encodeURIComponent(orderId)}/confirmation`;
        const ge = guestCheckoutEmail?.trim();
        return ge ? `${path}?guestEmail=${encodeURIComponent(ge)}` : path;
    }, [orderId, guestCheckoutEmail]);

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
                const qs = guestCheckoutEmail?.trim()
                    ? `?guestEmail=${encodeURIComponent(guestCheckoutEmail.trim())}`
                    : "";
                const order = await apiFetch<{ paymentStatus?: string }>(`/api/orders/${orderId}${qs}`);
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
    }, [isOpen, orderId, guestCheckoutEmail]);

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
            const order = await checkPaymentStatus(orderId, guestCheckoutEmail);
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
        <div className="fixed inset-0 z-[120] flex items-stretch justify-center p-0 sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div className="relative flex h-full max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border border-white/50 bg-white/95 shadow-2xl backdrop-blur-xl sm:h-auto sm:max-h-[min(90dvh,720px)] sm:rounded-3xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#6D4C41] transition-colors hover:bg-[#1B4332]/10 hover:text-[#1B4332]"
                    aria-label="Fechar"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pt-14 text-center sm:p-8 sm:pt-10">
                    <h2 className="text-2xl font-bold text-[#1B4332] font-playfair sm:text-3xl mb-4 pr-10">Pague com Pix</h2>

                    {paymentApproved ? (
                        <div className="py-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <p className="text-xl font-bold text-[#1B4332] font-playfair mb-2">Pagamento aprovado!</p>
                            <p className="text-[#6D4C41] font-inter mb-4">Obrigado pela sua compra.</p>
                            <Link
                                to={confirmationHref}
                                className="mb-4 inline-flex min-h-[48px] min-w-[10rem] items-center justify-center rounded-full border-2 border-[#1B4332]/25 px-8 py-3 text-base font-bold text-[#1B4332] font-inter hover:bg-[#FAF8F3]"
                            >
                                Ver confirmação do pedido
                            </Link>
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex min-h-[48px] min-w-[10rem] items-center justify-center rounded-full bg-gradient-to-r from-[#FFD166] to-[#FFE084] px-8 py-3 text-base font-bold text-[#1B4332] font-inter shadow-md"
                            >
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-base text-[#5a4035] mb-6 font-inter px-1">Escaneie o QR Code abaixo ou use o Copia e Cola</p>

                            {qrCodeBase64 && (
                                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6 mx-auto inline-block max-w-full">
                                    <img
                                        src={`data:image/png;base64,${qrCodeBase64}`}
                                        alt="QR Code Pix"
                                        className="mx-auto h-auto w-full max-w-[min(16rem,85vw)] aspect-square object-contain"
                                    />
                                </div>
                            )}

                            {qrCode && (
                                <div className="bg-[#1B4332]/5 p-4 rounded-2xl mb-6 text-left">
                                    <p className="text-base text-[#5a4035] font-inter mb-2">Código Pix Copia e Cola:</p>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                                        <input
                                            type="text"
                                            value={qrCode}
                                            readOnly
                                            className="min-h-[48px] w-full bg-white/60 border border-[#1B4332]/20 rounded-xl px-4 py-3 text-base text-[#1B4332] font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(qrCode)}
                                            className="inline-flex min-h-[48px] w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFD166] to-[#FFE084] px-5 py-3 text-base font-bold text-[#1B4332] hover:shadow-lg transition-shadow sm:min-w-[8rem]"
                                        >
                                            {copied ? <Check className="h-5 w-5 shrink-0" /> : <Copy className="h-5 w-5 shrink-0" />}
                                            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!paymentApproved && (
                    <div className="shrink-0 border-t border-[#1B4332]/10 bg-white/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(27,67,50,0.06)] sm:px-8">
                        <button
                            type="button"
                            onClick={verifyStatus}
                            disabled={isProcessing}
                            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#1B4332] py-3.5 text-base font-bold text-white transition-colors hover:bg-[#2d5a4a] font-inter disabled:opacity-60"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                                    <span>Verificando...</span>
                                </>
                            ) : (
                                <span>Já paguei — Verificar status</span>
                            )}
                        </button>
                        <p className="mt-3 text-center text-xs text-[#6D4C41]/80 font-inter sm:text-sm">
                            A confirmação é verificada automaticamente a cada 5s ou ao clicar em &quot;Já paguei&quot;.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
