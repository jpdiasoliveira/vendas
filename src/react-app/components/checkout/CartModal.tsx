import { useState } from "react";
import { X, Plus, Minus, Trash2, ShoppingBag, Tag } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useCart } from "@/react-app/contexts/CartContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import LoginModal from "@/react-app/components/LoginModal";
import CheckoutModal from "./CheckoutModal";
import { useCheckout } from "@/react-app/hooks/useCheckout";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, updateQuantity, removeItem, clearCart, total, calculateItemPrice } =
    useCart();
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const { createOrder, isProcessing, error } = useCheckout();
  const { settings } = useStoreSettings();

  if (!isOpen) return null;

  const minimumOrderValue = settings?.minimumOrderValue ?? null;
  const requireLoginToCheckout = settings?.publicProfile?.requireLoginToCheckout !== false;
  const belowMinimum =
    minimumOrderValue != null && minimumOrderValue > 0 && total < minimumOrderValue;
  const hasInsufficientStock = items.some(
    (item) => item.stock != null && item.quantity > item.stock
  );
  const hasRequiredFields =
    customerPhone.trim() !== "" && deliveryAddress.trim() !== "";
  const guestEmailOk = (() => {
    const t = guestEmail.trim();
    return t.length > 4 && t.includes("@") && !t.includes(" ");
  })();
  const canFinalize =
    !hasInsufficientStock &&
    hasRequiredFields &&
    !belowMinimum &&
    (requireLoginToCheckout ? !!user : !!user || guestEmailOk);

  const handleCheckout = async () => {
    if (requireLoginToCheckout && !user) {
      setShowLoginModal(true);
      return;
    }
    if (!requireLoginToCheckout && !user && !guestEmailOk) {
      return;
    }
    if (!customerPhone.trim()) {
      return;
    }
    if (!deliveryAddress.trim()) {
      return;
    }
    if (hasInsufficientStock || belowMinimum) {
      return;
    }

    try {
      const formattedItems = items.map((item) => {
        const unitPrice = calculateItemPrice(item, item.quantity);
        return {
          id: item.id,
          name: item.name,
          price: unitPrice,
          quantity: item.quantity,
          image: item.image,
        };
      });

      const data = await createOrder(formattedItems, {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        guestEmail: !user && guestEmailOk ? guestEmail.trim() : undefined,
      });
      setCurrentOrderId(data.orderId);
      setShowCheckoutModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 z-[100] h-[100dvh] max-h-[100dvh] w-full max-w-full transform bg-white shadow-2xl transition-transform duration-300 ease-out md:w-[min(480px,100%)]">
        <div className="flex h-full max-h-[inherit] flex-col overflow-hidden">
          <div className="shrink-0 bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white p-4 sm:p-6 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-playfair">Seu Carrinho</h2>
                <p className="text-sm text-white/80 font-inter">
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
              aria-label="Fechar carrinho"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 bg-gradient-to-b from-[#FAF8F3] to-white">
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
                {items.map((item) => {
                  const unitPrice = calculateItemPrice(item, item.quantity);
                  const lineTotal = unitPrice * item.quantity;
                  const isWholesale =
                    item.minQuantityWholesale != null &&
                    item.quantity >= item.minQuantityWholesale &&
                    item.priceWholesale != null &&
                    item.priceWholesale < item.price;
                  const savingsPerUnit = isWholesale
                    ? item.price - (item.priceWholesale ?? 0)
                    : 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                    >
                      {isWholesale && (
                        <div className="flex items-center gap-1.5 mb-2 text-[#1B4332] bg-[#FFD166]/20 border border-[#FFD166]/40 rounded-lg px-2 py-1 w-fit">
                          <Tag className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs font-semibold font-inter">
                            Preço de Atacado Aplicado!
                          </span>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#FAF8F3] to-[#FFD166]/10 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-bold text-[#1B4332] font-playfair">
                                {item.name}
                              </h4>
                              <p className="text-lg font-bold text-[#1B4332] font-playfair">
                                R$ {unitPrice.toFixed(2)}
                                {isWholesale && (
                                  <span className="ml-2 text-sm font-normal text-green-700 font-inter">
                                    (economia de R$ {savingsPerUnit.toFixed(2)}/un.)
                                  </span>
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-lg shrink-0"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white hover:shadow-lg transition-transform active:scale-95"
                              aria-label="Diminuir quantidade"
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                            <span className="font-bold text-[#1B4332] min-w-[2rem] text-center text-base font-inter">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white hover:shadow-lg transition-transform active:scale-95"
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                            <span className="text-sm text-[#6D4C41] font-inter ml-1">
                              = R$ {lineTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="shrink-0 border-t border-[#1B4332]/10 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(27,67,50,0.08)] sm:p-6 space-y-4">
              <div className="space-y-3 font-inter">
                <label className="block text-sm font-medium text-[#6D4C41]">
                  Nome do cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Como devemos chamar você?"
                  className="w-full px-4 py-3 rounded-xl border border-[#1B4332]/20 bg-white/80 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]"
                  aria-label="Nome do cliente"
                />
                <label className="block text-sm font-medium text-[#6D4C41]">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#1B4332]/20 bg-white/80 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]"
                  aria-label="Telefone para contato"
                  aria-required="true"
                />
                <label className="block text-sm font-medium text-[#6D4C41]">
                  Endereço de entrega <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade..."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#1B4332]/20 bg-white/80 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]"
                  aria-label="Endereço de entrega"
                  aria-required="true"
                />
              </div>
              {belowMinimum && (
                <p className="text-amber-700 text-sm font-inter">
                  O valor mínimo para pedidos é R$ {minimumOrderValue!.toFixed(2).replace(".", ",")}.
                </p>
              )}
              {hasInsufficientStock && (
                <p className="text-red-600 text-sm font-inter">
                  Estoque insuficiente em um ou mais itens. Ajuste as quantidades ou remova itens.
                </p>
              )}
              {!requireLoginToCheckout && !user && (
                <div>
                  <label className="block text-sm font-medium text-[#6D4C41] mb-1">
                    E-mail para confirmação e pagamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl border border-[#1B4332]/20 bg-white/80 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]"
                    aria-label="E-mail (checkout sem login)"
                  />
                  <p className="text-xs text-[#6D4C41]/80 mt-1">
                    Use o mesmo e-mail ao pagar e para consultar o status do pedido.
                  </p>
                </div>
              )}
              {requireLoginToCheckout && !user && items.length > 0 && (
                <p className="text-amber-800 text-sm font-inter bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Faça login para finalizar a compra. Use o botão abaixo: será solicitado e-mail e senha (ou Google).
                </p>
              )}
              {!hasRequiredFields && items.length > 0 && (
                <p className="text-amber-700 text-sm font-inter">
                  Preencha telefone e endereço de entrega para finalizar.
                </p>
              )}
              <div className="flex items-center justify-between text-lg font-inter">
                <span className="text-[#6D4C41]">Subtotal:</span>
                <span className="font-bold text-[#1B4332] text-2xl font-playfair">
                  R$ {total.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessing || !canFinalize}
                className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FFD166] to-[#FFE084] py-4 text-base font-bold text-[#1B4332] shadow-md hover:shadow-xl hover:shadow-[#FFD166]/40 transition-transform active:scale-[0.99] font-inter disabled:opacity-50 disabled:cursor-not-allowed sm:text-lg"
              >
                {isProcessing
                  ? "Processando..."
                  : requireLoginToCheckout && !user
                    ? "Entrar e finalizar"
                    : "Finalizar Compra"}
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="flex min-h-[44px] w-full items-center justify-center rounded-xl text-base font-medium text-[#6D4C41] transition-colors hover:bg-red-50 hover:text-red-700 font-inter"
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
          guestCheckoutEmail={!user && guestEmail.trim() ? guestEmail.trim() : null}
        />
      )}
    </>
  );
}
