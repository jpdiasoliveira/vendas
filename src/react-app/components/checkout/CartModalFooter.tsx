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
  <div className="shrink-0 space-y-4 border-t border-[#1B4332]/10 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(27,67,50,0.08)] sm:p-6">
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
    <div className="flex items-center justify-between font-inter text-lg">
      <span className="text-[#6D4C41]">Subtotal:</span>
      <span className="font-playfair text-2xl font-bold text-[#1B4332]">R$ {total.toFixed(2)}</span>
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
