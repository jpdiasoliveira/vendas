import { X, ShoppingBag } from "lucide-react";
import LoginModal from "@/react-app/components/LoginModal";
import CheckoutModal from "./CheckoutModal";
import { CartModalLineItems } from "./CartModalLineItems";
import { CartModalFooter } from "./CartModalFooter";
import { useCartModalCheckout } from "@/react-app/hooks/useCartModalCheckout";

type CartModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CartModal = ({ isOpen, onClose }: CartModalProps) => {
  const m = useCartModalCheckout(onClose);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-[100] h-[100dvh] max-h-[100dvh] w-full max-w-full transform bg-white shadow-2xl transition-transform duration-300 ease-out md:w-[min(480px,100%)]">
        <div className="flex h-full max-h-[inherit] min-h-0 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] p-4 text-white sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-playfair text-2xl font-bold">Seu Carrinho</h2>
                <p className="font-inter text-sm text-white/80">
                  {m.items.length} {m.items.length === 1 ? "item" : "itens"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="Fechar carrinho"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-gradient-to-b from-[#FAF8F3] to-white">
            <div className="p-4 sm:p-6">
              {m.error && (
                <div className="mb-4 rounded-xl bg-red-50 p-4 font-inter text-sm text-red-500">{m.error}</div>
              )}
              {m.items.length === 0 ? (
                <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                  <div className="mb-6 rounded-full bg-gradient-to-br from-[#1B4332]/10 to-[#FFD166]/10 p-8">
                    <ShoppingBag className="h-16 w-16 text-[#6D4C41]/40" />
                  </div>
                  <h3 className="mb-2 font-playfair text-xl font-bold text-[#1B4332]">Seu carrinho está vazio</h3>
                  <p className="font-inter text-[#6D4C41]">Adicione produtos para começar</p>
                </div>
              ) : (
                <>
                  <CartModalLineItems
                    items={m.items}
                    calculateItemPrice={m.calculateItemPrice}
                    updateQuantity={m.updateQuantity}
                    removeItem={m.removeItem}
                  />
                  <CartModalFooter
                    user={m.user}
                    customerName={m.customerName}
                    setCustomerName={m.setCustomerName}
                    customerPhone={m.customerPhone}
                    setCustomerPhone={m.setCustomerPhone}
                    deliveryAddress={m.deliveryAddress}
                    setDeliveryAddress={m.setDeliveryAddress}
                    guestEmail={m.guestEmail}
                    setGuestEmail={m.setGuestEmail}
                    total={m.total}
                    shippingCep={m.shippingCep}
                    setShippingCep={m.setShippingCep}
                    onQuoteShipping={m.handleQuoteShipping}
                    shippingLoading={m.shippingLoading}
                    shippingError={m.shippingError}
                    shippingFee={m.shippingFee}
                    shippingReady={m.shippingReady != null && !m.shippingError}
                    couponInput={m.couponInput}
                    setCouponInput={m.setCouponInput}
                    onApplyCoupon={m.handleApplyCoupon}
                    couponLoading={m.couponLoading}
                    couponError={m.couponError}
                    couponDiscount={m.couponDiscount}
                    grandTotal={m.grandTotal}
                    minimumOrderValue={m.minimumOrderValue}
                    belowMinimum={m.belowMinimum}
                    hasInsufficientStock={m.hasInsufficientStock}
                    requireLoginToCheckout={m.requireLoginToCheckout}
                    hasRequiredFields={m.hasRequiredFields}
                    canFinalize={m.canFinalize}
                    isProcessing={m.isProcessing}
                    onCheckout={() => void m.handleCheckout()}
                    onClearCart={m.clearCart}
                  />
                </>
              )}
            </div>
            {/* Espaço extra no fim do scroll para o botão não ficar colado na barra do sistema (iOS/Android). */}
            {m.items.length > 0 ? (
              <div className="shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]" aria-hidden />
            ) : null}
          </div>
        </div>
      </div>

      <LoginModal isOpen={m.showLoginModal} onClose={() => m.setShowLoginModal(false)} />

      {m.currentOrderId && (
        <CheckoutModal
          isOpen={m.showCheckoutModal}
          onClose={m.closeCheckoutSuccess}
          orderId={m.currentOrderId}
          total={m.placedOrderTotal ?? m.grandTotal}
          guestCheckoutEmail={!m.user && m.guestEmail.trim() ? m.guestEmail.trim() : null}
        />
      )}
    </>
  );
};

export default CartModal;
