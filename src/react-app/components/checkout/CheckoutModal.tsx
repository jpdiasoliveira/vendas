import { useState } from 'react';
import { X, CreditCard, QrCode, Loader2 } from 'lucide-react';
import PixPaymentModal from './PixPaymentModal';
import { useCheckout } from '@/react-app/hooks/useCheckout';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    total: number;
    /** Quando o pedido foi criado sem login (checkout visitante). */
    guestCheckoutEmail?: string | null;
}

export default function CheckoutModal({
    isOpen,
    onClose,
    orderId,
    total,
    guestCheckoutEmail,
}: CheckoutModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<'pix' | 'boleto' | 'credit_card' | null>(null);
    const [showPixModal, setShowPixModal] = useState(false);
    const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null);

    const { processPayment, isProcessing, error } = useCheckout();

    if (!isOpen) return null;

    const handlePayment = async () => {
        if (!selectedMethod) return;

        try {
            const data = await processPayment(orderId, selectedMethod, guestCheckoutEmail);

            const pixBase64 = data.qrCodeBase64 ?? data.qr_code_base64;
            const pixCopyPaste = data.copyPaste ?? data.pixCode ?? data.qr_code;
            if (selectedMethod === 'pix' && (pixBase64 || pixCopyPaste)) {
                setPixData({
                    qr_code: pixCopyPaste ?? '',
                    qr_code_base64: pixBase64 ?? '',
                });
                setShowPixModal(true);
            } else if (selectedMethod === 'boleto' && data.ticket_url) {
                // Open Boleto in new tab
                window.open(data.ticket_url, '_blank');
                alert('Boleto aberto em nova aba. Por favor, efetue o pagamento.');
                onClose();
            } else if (selectedMethod === 'credit_card' && data.init_point) {
                // Redirect to Mercado Pago checkout
                window.location.href = data.init_point;
            } else {
                alert('Erro: Dados de pagamento incompletos. Tente novamente.');
            }
        } catch {
            // Erro já tratado no useCheckout (setError + throw)
        }
    };

    const handleClosePixModal = () => {
        setShowPixModal(false);
        setPixData(null);
        setSelectedMethod(null);
        onClose();
    };

    const paymentMethods = [
        {
            id: 'pix' as const,
            name: 'Pix',
            description: 'Pagamento instantâneo',
            icon: QrCode,
            color: 'from-teal-500 to-cyan-500',
        },
        {
            id: 'credit_card' as const,
            name: 'Cartão de Crédito',
            description: 'Parcelamento em até 12x',
            icon: CreditCard,
            color: 'from-blue-500 to-indigo-500',
        },
    ];

    return (
        <>
            <div className="fixed inset-0 z-[110] flex items-stretch justify-center p-0 sm:items-center sm:p-4">
                <div className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-md" onClick={onClose} aria-hidden />
                <div className="relative flex h-full max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border border-white/50 bg-white/95 shadow-2xl backdrop-blur-xl sm:h-auto sm:max-h-[min(90dvh,720px)] sm:rounded-3xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#6D4C41] transition-colors hover:bg-[#1B4332]/10 hover:text-[#1B4332]"
                        aria-label="Fechar"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-2 pt-14 sm:p-8 sm:pt-10">
                        <h2 className="text-2xl font-bold text-[#1B4332] font-playfair sm:text-3xl mb-2 pr-10">
                            Escolha a forma de pagamento
                        </h2>
                        <p className="text-base text-[#5a4035] mb-6 font-inter">
                            Pedido #{orderId} • Total: R$ {total.toFixed(2)}
                        </p>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 font-inter text-base">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3 sm:space-y-4">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                const isSelected = selectedMethod === method.id;

                                return (
                                    <button
                                        type="button"
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`w-full min-h-[72px] flex items-center gap-4 p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 text-left ${isSelected
                                            ? 'border-[#1B4332] bg-gradient-to-r from-[#1B4332]/5 to-[#FFD166]/5 shadow-lg'
                                            : 'border-[#1B4332]/10 hover:border-[#1B4332]/30 bg-white/60 active:scale-[0.99]'
                                            }`}
                                    >
                                        <div className={`shrink-0 p-3 sm:p-4 rounded-xl bg-gradient-to-r ${method.color} text-white`}>
                                            <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg sm:text-xl font-bold text-[#1B4332] font-playfair">{method.name}</h3>
                                            <p className="text-base text-[#5a4035] font-inter">{method.description}</p>
                                        </div>
                                        <div
                                            className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#1B4332] bg-[#1B4332]' : 'border-[#1B4332]/20'
                                                }`}
                                            aria-hidden
                                        >
                                            {isSelected && <div className="h-3 w-3 rounded-full bg-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="shrink-0 border-t border-[#1B4332]/10 bg-white/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(27,67,50,0.06)] sm:px-8">
                        <button
                            type="button"
                            onClick={handlePayment}
                            disabled={!selectedMethod || isProcessing}
                            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FFD166] to-[#FFE084] py-4 text-base font-bold text-[#1B4332] shadow-md hover:shadow-xl hover:shadow-[#FFD166]/40 transition-transform active:scale-[0.99] font-inter disabled:opacity-50 disabled:cursor-not-allowed sm:text-lg"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                                    <span>Processando...</span>
                                </>
                            ) : (
                                <span>Continuar para Pagamento</span>
                            )}
                        </button>
                        <p className="mt-3 text-center text-xs text-[#6D4C41]/80 font-inter sm:text-sm">
                            Pagamento processado de forma segura pelo Mercado Pago
                        </p>
                    </div>
                </div>
            </div>

            {showPixModal && pixData && (
                <PixPaymentModal
                    isOpen={showPixModal}
                    onClose={handleClosePixModal}
                    orderId={orderId}
                    qrCode={pixData.qr_code}
                    qrCodeBase64={pixData.qr_code_base64}
                    guestCheckoutEmail={guestCheckoutEmail}
                />
            )}
        </>
    );
}
