import { CheckCircle2, CreditCard, Home, Loader2, Save } from "lucide-react";
import type { AdminSettingsViewModel } from "@/react-app/hooks/useAdminSettings";

/**
 * Regras de carrinho e fecho do pedido (valor mínimo, login).
 * Guardadas pelo mesmo PATCH que a estilização — página separada só de UX.
 */
export const AdminCheckoutSettingsForm = ({ m }: { m: AdminSettingsViewModel }) => {
  const {
    navigate,
    error,
    success,
    saving,
    minimumOrderValue,
    setMinimumOrderValue,
    publicProfile,
    setPublicProfile,
    checkoutLoginAck,
    setCheckoutLoginAck,
    handleSubmit,
    inputCls,
  } = m;

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full border border-[#1B4332]/10 bg-white/60 p-2 text-[#6D4C41] shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[#1B4332]"
            aria-label="Voltar ao site"
          >
            <Home className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <CreditCard className="h-9 w-9 shrink-0 text-[#1B4332] sm:h-10 sm:w-10" aria-hidden />
            <div>
              <h1 className="font-playfair text-3xl font-bold tracking-tight text-[#1B4332] sm:text-4xl">
                Checkout e pedidos
              </h1>
              <p className="mt-0.5 font-inter text-sm text-[#6D4C41]">
                Valor mínimo do carrinho e se o cliente precisa de conta para comprar — independente da aparência da
                loja na secção{" "}
                <button
                  type="button"
                  onClick={() => navigate("/admin/loja/vitrine")}
                  className="font-medium text-[#1B4332] underline decoration-[#1B4332]/30 underline-offset-2 hover:decoration-[#1B4332]"
                >
                  Vitrine
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-inter text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div
          className="mb-6 flex gap-3 rounded-2xl border border-green-200 bg-green-50/95 px-4 py-4 text-green-900 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" aria-hidden />
          <div className="min-w-0 font-inter">
            <p className="font-semibold text-green-900">Alterações guardadas</p>
            <p className="mt-1 text-sm text-green-800/90">As regras de checkout já estão ativas nesta loja.</p>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="w-full min-w-0 rounded-3xl border border-[#1B4332]/10 bg-white/90 p-5 font-inter shadow-sm backdrop-blur-sm sm:p-8"
      >
        <section className="space-y-4">
          <h2 className="border-b border-[#1B4332]/15 pb-2 text-lg font-semibold text-[#1B4332]">Carrinho e fecho</h2>
          <p className="text-xs leading-relaxed text-[#6D4C41]/85">
            Estes valores aplicam-se ao <strong className="text-[#1B4332]">carrinho e ao pagamento</strong>, não aos
            textos ou imagens da página inicial.
          </p>
          <div>
            <label htmlFor="minimumOrderValue" className="mb-1 block text-sm font-medium text-[#6D4C41]">
              Valor mínimo de pedido (R$)
            </label>
            <input
              id="minimumOrderValue"
              type="text"
              inputMode="decimal"
              value={minimumOrderValue}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                if (v === "") {
                  setMinimumOrderValue("");
                  return;
                }
                const n = Number(v) / 100;
                setMinimumOrderValue(n.toFixed(2).replace(".", ","));
              }}
              placeholder="0,00"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-[#6D4C41]/75">Deixe 0,00 ou vazio para não exigir valor mínimo.</p>
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 rounded border-[#1B4332]/30 text-[#1B4332] focus:ring-[#1B4332]/30"
              checked={publicProfile.requireLoginToCheckout !== false}
              onChange={(e) => {
                const checked = e.target.checked;
                setPublicProfile((p) => ({
                  ...p,
                  requireLoginToCheckout: checked,
                }));
                setCheckoutLoginAck(
                  checked
                    ? "Ao gravar, a loja passará a exigir login para finalizar a compra."
                    : "Ao gravar, visitantes poderão comprar sem conta (e-mail, telefone e endereço)."
                );
              }}
            />
            <span>
              <span className="font-medium text-[#1B4332]">Exigir login para comprar</span>
              <span className="mt-0.5 block text-sm text-[#6D4C41]">
                Desmarcado: o cliente pode finalizar informando e-mail, telefone e endereço (sem conta). O e-mail é
                usado para segurança no pagamento e consulta do pedido.
              </span>
            </span>
          </label>
          {checkoutLoginAck ? (
            <div
              className="flex gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950"
              role="status"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              <p>{checkoutLoginAck}</p>
            </div>
          ) : null}
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#1B4332]/10 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123325] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden /> : <Save className="h-5 w-5 shrink-0" aria-hidden />}
            {saving ? "Salvando…" : "Salvar regras de checkout"}
          </button>
        </div>
      </form>
    </div>
  );
};
