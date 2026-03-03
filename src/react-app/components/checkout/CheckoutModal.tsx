import { useState } from 'react';
import { X, CreditCard, QrCode, FileText, Loader2 } from 'lucide-react';
import PixPaymentModal from './PixPaymentModal';
import { useCheckout } from '@/react-app/hooks/useCheckout';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    total: number;
}

export default function CheckoutModal({ isOpen, onClose, orderId, total }: CheckoutModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<'pix' | 'boleto' | 'credit_card' | null>(null);
    const [showPixModal, setShowPixModal] = useState(false);
    const [pixData, setPixData] = useState<any>(null);

    const { processPayment, isProcessing, error } = useCheckout();

    if (!isOpen) return null;

    const handlePayment = async () => {
        if (!selectedMethod) return;

        try {
            const data = await processPayment(orderId, selectedMethod);

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
        } catch (error) {
            // Erro já tradado no interceptador do useCheckout
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
            id: 'boleto' as const,
            name: 'Boleto',
            description: 'Pagamento em até 3 dias úteis',
            icon: FileText,
            color: 'from-orange-500 to-yellow-500',
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm" onClick={onClose}></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-white/50 max-h-[90vh] overflow-y-auto">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-[#6D4C41] hover:text-[#1B4332] transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <h2 className="text-3xl font-bold text-[#1B4332] font-playfair mb-2">Escolha a forma de pagamento</h2>
                    <p className="text-[#6D4C41] mb-6 font-inter">Pedido #{orderId} • Total: R$ {total.toFixed(2)}</p>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-4 font-inter text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 mb-8">
                        {paymentMethods.map((method) => {
                            const Icon = method.icon;
                            const isSelected = selectedMethod === method.id;

                            return (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`w-full flex items-center space-x-4 p-6 rounded-2xl border-2 transition-all duration-300 ${isSelected
                                        ? 'border-[#1B4332] bg-gradient-to-r from-[#1B4332]/5 to-[#FFD166]/5 shadow-lg'
                                        : 'border-[#1B4332]/10 hover:border-[#1B4332]/30 bg-white/60'
                                        }`}
                                >
                                    <div className={`p-4 rounded-xl bg-gradient-to-r ${method.color} text-white`}>
                                        <Icon className="h-8 w-8" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="text-xl font-bold text-[#1B4332] font-playfair">{method.name}</h3>
                                        <p className="text-sm text-[#6D4C41] font-inter">{method.description}</p>
                                    </div>
                                    <div
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#1B4332] bg-[#1B4332]' : 'border-[#1B4332]/20'
                                            }`}
                                    >
                                        {isSelected && <div className="w-3 h-3 rounded-full bg-white"></div>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={!selectedMethod || isProcessing}
                        className="w-full bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#FFD166]/50 transition-all duration-300 hover:scale-105 font-inter disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Processando...</span>
                            </>
                        ) : (
                            <span>Continuar para Pagamento</span>
                        )}
                    </button>

                    <p className="text-xs text-[#6D4C41]/70 text-center mt-4 font-inter">
                        Pagamento processado de forma segura pelo Mercado Pago
                    </p>
                </div>
            </div>

            {showPixModal && pixData && (
                <PixPaymentModal
                    isOpen={showPixModal}
                    onClose={handleClosePixModal}
                    orderId={orderId}
                    qrCode={pixData.qr_code}
                    qrCodeBase64={pixData.qr_code_base64}
                />
            )}
        </>
    );
}
