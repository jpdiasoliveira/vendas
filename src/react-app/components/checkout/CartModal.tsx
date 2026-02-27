import { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useCart } from '@/react-app/contexts/CartContext';
import LoginModal from '@/react-app/components/LoginModal';
import CheckoutModal from './CheckoutModal';
import { useCheckout } from '@/react-app/hooks/useCheckout';

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
    const { items, updateQuantity, removeItem, clearCart, total } = useCart();
    const { user } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);

    const { createOrder, isProcessing, error } = useCheckout();

    if (!isOpen) return null;

    const handleCheckout = async () => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        try {
            const formattedItems = items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
            }));

            const data = await createOrder(formattedItems);
            setCurrentOrderId(data.orderId);
            setShowCheckoutModal(true);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white p-6 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                                <ShoppingBag className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold font-playfair">Seu Carrinho</h2>
                                <p className="text-sm text-white/80 font-inter">
                                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-full transition-all duration-300 hover:scale-110"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#FAF8F3] to-white">
                        {error && (
                            <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-4 font-inter text-sm">
                                {error}
                            </div>
                        )}

                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="bg-gradient-to-br from-[#1B4332]/10 to-[#FFD166]/10 rounded-full p-8 mb-6">
                                    <ShoppingBag className="h-16 w-16 text-[#6D4C41]/40" />
                                </div>
                                <h3 className="text-xl font-bold text-[#1B4332] mb-2 font-playfair">
                                    Seu carrinho está vazio
                                </h3>
                                <p className="text-[#6D4C41] font-inter">
                                    Adicione produtos para começar
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-24 h-24 bg-gradient-to-br from-[#FAF8F3] to-[#FFD166]/10 rounded-xl flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-[#1B4332] font-playfair">
                                                            {item.name}
                                                        </h4>
                                                        <p className="text-lg font-bold text-[#1B4332] font-playfair">
                                                            R$ {item.price.toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-red-500 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white p-1.5 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="font-bold text-[#1B4332] w-8 text-center font-inter">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white p-1.5 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="bg-white border-t border-[#1B4332]/10 p-6 space-y-4">
                            <div className="flex items-center justify-between text-lg font-inter">
                                <span className="text-[#6D4C41]">Subtotal:</span>
                                <span className="font-bold text-[#1B4332] text-2xl font-playfair">
                                    R$ {total.toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing}
                                className="w-full bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#FFD166]/50 transition-all duration-300 hover:scale-105 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Processando...' : 'Finalizar Compra'}
                            </button>
                            <button
                                onClick={clearCart}
                                className="w-full text-[#6D4C41] hover:text-red-600 font-medium py-2 transition-colors font-inter"
                            >
                                Limpar Carrinho
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

            {currentOrderId && (
                <CheckoutModal
                    isOpen={showCheckoutModal}
                    onClose={() => {
                        setShowCheckoutModal(false);
                        clearCart();
                        onClose();
                    }}
                    orderId={currentOrderId}
                    total={total}
                />
            )}
        </>
    );
}
