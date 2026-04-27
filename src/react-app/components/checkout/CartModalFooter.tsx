import { MapPin, Tag, Loader2 } from "lucide-react";

type CartModalFooterProps = {
  /** Usuário logado (truthy) ou visitante. */
  user: unknown;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (v: string) => void;
  guestEmail: string;
  setGuestEmail: (v: string) => void;
  total: number;
  shippingCep: string;
  setShippingCep: (v: string) => void;
  onQuoteShipping: () => void;
  shippingLoading: boolean;
  shippingError: string | null;
  shippingFee: number;
  shippingReady: boolean;
  couponInput: string;
  setCouponInput: (v: string) => void;
  onApplyCoupon: () => void;
  couponLoading: boolean;
  couponError: string | null;
  couponDiscount: number;
  grandTotal: number;
  minimumOrderValue: number | null;
  belowMinimum: boolean;
  hasInsufficientStock: boolean;
  requireLoginToCheckout: boolean;
  hasRequiredFields: boolean;
  canFinalize: boolean;
  isProcessing: boolean;
  onCheckout: () => void;
  onClearCart: () => void;
};

export const CartModalFooter = ({
  user,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  deliveryAddress,
  setDeliveryAddress,
  guestEmail,
  setGuestEmail,
  total,
  shippingCep,
  setShippingCep,
  onQuoteShipping,
  shippingLoading,
  shippingError,
  shippingFee,
  shippingReady,
  couponInput,
  setCouponInput,
  onApplyCoupon,
  couponLoading,
  couponError,
  couponDiscount,
  grandTotal,
  minimumOrderValue,
  belowMinimum,
  hasInsufficientStock,
  requireLoginToCheckout,
  hasRequiredFields,
  canFinalize,
  isProcessing,
  onCheckout,
  onClearCart,
}: CartModalFooterProps) => (
  <div className="mt-6 shrink-0 space-y-4 rounded-2xl border border-[#1B4332]/10 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-sm sm:p-6">
    <div className="space-y-3 font-inter">
      <label className="block text-sm font-medium text-[#6D4C41]">Nome do cliente</label>
      <input
        type="text"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder="Como devemos chamar você?"
        className="w-full rounded-xl border border-[#1B4332]/20 bg-white/80 px-4 py-3 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
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
        className="w-full rounded-xl border border-[#1B4332]/20 bg-white/80 px-4 py-3 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
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
        className="w-full rounded-xl border border-[#1B4332]/20 bg-white/80 px-4 py-3 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
        aria-label="Endereço de entrega"
        aria-required="true"
      />
      <div>
        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-[#6D4C41]">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          CEP para frete <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={shippingCep}
            onChange={(e) => setShippingCep(e.target.value)}
            placeholder="00000-000"
            className="min-w-0 flex-1 rounded-xl border border-[#1B4332]/20 bg-white/80 px-4 py-3 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            aria-label="CEP para cálculo de frete"
          />
          <button
            type="button"
            onClick={() => void onQuoteShipping()}
            disabled={shippingLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#1B4332]/25 bg-[#1B4332] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2D5F4A] disabled:opacity-50"
          >
            {shippingLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {shippingLoading ? "…" : "Calcular"}
          </button>
        </div>
        {shippingError ? (
          <p className="mt-2 text-sm text-red-600">{shippingError}</p>
        ) : shippingReady ? (
          <p className="mt-2 text-sm text-emerald-800">
            Frete para o CEP informado: R$ {shippingFee.toFixed(2).replace(".", ",")}
          </p>
        ) : (
          <p className="mt-1 text-xs text-[#6D4C41]/80">Informe o CEP e toque em Calcular para ver se entregamos na sua região.</p>
        )}
      </div>
      <div>
        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-[#6D4C41]">
          <Tag className="h-4 w-4 shrink-0" aria-hidden />
          Cupom de desconto
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Código"
            className="min-w-0 flex-1 rounded-xl border border-[#1B4332]/20 bg-white/80 px-4 py-3 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            aria-label="Código do cupom"
          />
          <button
            type="button"
            onClick={() => void onApplyCoupon()}
            disabled={couponLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#1B4332]/25 bg-[#FAF8F3] px-4 py-3 text-sm font-semibold text-[#1B4332] transition-colors hover:bg-[#1B4332]/10 disabled:opacity-50"
          >
            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Aplicar
          </button>
        </div>
        {couponError ? <p className="mt-2 text-sm text-red-600">{couponError}</p> : null}
        {couponDiscount > 0 && !couponError ? (
          <p className="mt-2 text-sm text-emerald-800">
            Desconto do cupom: − R$ {couponDiscount.toFixed(2).replace(".", ",")} (confirmado de novo no servidor ao finalizar)
          </p>
        ) : null}
      </div>
    </div>
    {belowMinimum && (
      <p className="font-inter text-sm text-amber-700">
        O valor mínimo para pedidos é R$ {minimumOrderValue!.toFixed(2).replace(".", ",")}.
      </p>
    )}
    {hasInsufficientStock && (
      <p className="font-inter text-sm text-red-600">
        Estoque insuficiente em um ou mais itens. Ajuste as quantidades ou remova itens.
      </p>
    )}
    {!requireLoginToCheckout && !user && (
      <div>
        <label className="mb-1 block text-sm font-medium text-[#6D4C41]">
          E-mail para confirmação e pagamento <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          className="w-full rounded-xl border border-[#1B4332]/20 bg-white/80 px-4 py-3 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          aria-label="E-mail (checkout sem login)"
        />
        <p className="mt-1 text-xs text-[#6D4C41]/80">Use o mesmo e-mail ao pagar e para consultar o status do pedido.</p>
      </div>
    )}
    {requireLoginToCheckout && !user && (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 font-inter text-sm text-amber-800">
        Faça login para finalizar a compra. Use o botão abaixo: será solicitado e-mail e senha (ou Google).
      </p>
    )}
    {!hasRequiredFields && (
      <p className="font-inter text-sm text-amber-700">Preencha telefone e endereço de entrega para finalizar.</p>
    )}
    {!shippingReady && hasRequiredFields && (
      <p className="font-inter text-sm text-amber-700">Calcule o frete pelo CEP para finalizar o pedido.</p>
    )}
    <div className="space-y-2 border-t border-[#1B4332]/10 pt-3 font-inter text-base">
      <div className="flex justify-between text-[#6D4C41]">
        <span>Subtotal (itens)</span>
        <span className="font-medium text-[#1B4332]">R$ {total.toFixed(2).replace(".", ",")}</span>
      </div>
      <div className="flex justify-between text-[#6D4C41]">
        <span>Frete</span>
        <span className="font-medium text-[#1B4332]">
          {shippingReady ? `R$ ${shippingFee.toFixed(2).replace(".", ",")}` : "—"}
        </span>
      </div>
      {couponDiscount > 0 ? (
        <div className="flex justify-between text-emerald-800">
          <span>Cupom</span>
          <span className="font-medium">− R$ {couponDiscount.toFixed(2).replace(".", ",")}</span>
        </div>
      ) : null}
      <div className="flex items-center justify-between text-lg">
        <span className="text-[#6D4C41]">Total</span>
        <span className="font-playfair text-2xl font-bold text-[#1B4332]">
          R$ {grandTotal.toFixed(2).replace(".", ",")}
        </span>
      </div>
    </div>
    <button
      type="button"
      onClick={onCheckout}
      disabled={isProcessing || !canFinalize}
      className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FFD166] to-[#FFE084] py-4 font-inter text-base font-bold text-[#1B4332] shadow-md transition-transform hover:shadow-xl hover:shadow-[#FFD166]/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
    >
      {isProcessing
        ? "Processando..."
        : requireLoginToCheckout && !user
          ? "Entrar e finalizar"
          : "Finalizar Compra"}
    </button>
    <button
      type="button"
      onClick={onClearCart}
      className="flex min-h-[44px] w-full items-center justify-center rounded-xl font-inter text-base font-medium text-[#6D4C41] transition-colors hover:bg-red-50 hover:text-red-700"
    >
      Limpar Carrinho
    </button>
  </div>
);
