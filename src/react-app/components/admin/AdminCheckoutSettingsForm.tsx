import { useEffect } from "react";
import { FormProvider, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { CheckCircle2, CreditCard, Loader2, Save } from "lucide-react";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import { MercadoPagoCredentialsForm } from "@/react-app/components/admin/checkout/MercadoPagoCredentialsForm";
import { useAdminCheckoutSettingsPage } from "@/react-app/hooks/admin/settings/useAdminCheckoutSettingsPage";
import { useToast } from "@/react-app/providers/ToastProvider";

function CheckoutRulesFields({
  checkoutLoginAck,
  setCheckoutLoginAck,
}: {
  checkoutLoginAck: string | null;
  setCheckoutLoginAck: (value: string | null) => void;
}) {
  const { register, watch, setValue } = useFormContext<AdminSettingsFormValues>();
  const requireLogin = watch("publicProfile.requireLoginToCheckout") !== false;

  return (
    <section className="space-y-4">
      <h2 className="border-b border-brand-primary/15 pb-2 text-lg font-semibold text-content">
        Carrinho e fecho
      </h2>
      <p className="text-xs leading-relaxed text-content-muted">
        Estes valores aplicam-se ao <strong className="text-content">carrinho e ao pagamento</strong>, não aos textos
        ou imagens da página inicial.
      </p>
      <div>
        <label htmlFor="minimumOrderValue" className="mb-1 block text-sm font-medium text-content-muted">
          Valor mínimo de pedido (R$)
        </label>
        <input
          id="minimumOrderValue"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          className={storefrontInputClass}
          {...register("minimumOrderValue", {
            onChange: (e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (v === "") {
                setValue("minimumOrderValue", "");
                return;
              }
              const n = Number(v) / 100;
              setValue("minimumOrderValue", n.toFixed(2).replace(".", ","));
            },
          })}
        />
        <p className="mt-1 text-xs text-content-muted">Deixe 0,00 ou vazio para não exigir valor mínimo.</p>
      </div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 rounded border-brand-primary/30 text-brand-primary focus:ring-brand-primary/30"
          checked={requireLogin}
          onChange={(e) => {
            const checked = e.target.checked;
            setValue("publicProfile.requireLoginToCheckout", checked);
            setCheckoutLoginAck(
              checked
                ? "Ao gravar, a loja passará a exigir login para finalizar a compra."
                : "Ao gravar, visitantes poderão comprar sem conta (e-mail, telefone e endereço).",
            );
          }}
        />
        <span>
          <span className="font-medium text-content">Exigir login para comprar</span>
          <span className="mt-0.5 block text-sm text-content-muted">
            Desmarcado: o cliente pode finalizar informando e-mail, telefone e endereço (sem conta).
          </span>
        </span>
      </label>
      {checkoutLoginAck ? (
        <div
          className="flex gap-3 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-content"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
          <p>{checkoutLoginAck}</p>
        </div>
      ) : null}
    </section>
  );
}

export function AdminCheckoutSettingsForm() {
  const page = useAdminCheckoutSettingsPage();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (page.loadError) showToast({ type: "error", message: page.loadError });
  }, [page.loadError, showToast]);

  if (page.loading) {
    return (
      <div className="w-full min-w-0 rounded-2xl border border-brand-primary/10 bg-surface-elevated p-12 text-center">
        <p className="text-content-muted">A carregar…</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex items-center gap-3">
        <CreditCard className="h-9 w-9 shrink-0 text-brand-primary sm:h-10 sm:w-10" aria-hidden />
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
            Checkout e pedidos
          </h1>
          <p className="mt-0.5 text-sm text-content-muted">
            Valor mínimo do carrinho e login na compra — independente da aparência na secção{" "}
            <button
              type="button"
              onClick={() => navigate("/admin/loja/vitrine")}
              className="font-medium text-brand-primary underline decoration-brand-primary/30 underline-offset-2 hover:decoration-brand-primary"
            >
              Vitrine
            </button>
            .
          </p>
        </div>
      </div>

      <FormProvider {...page.form}>
        <form
          onSubmit={page.form.handleSubmit(page.handleSave)}
          className="w-full min-w-0 rounded-2xl border border-brand-primary/10 bg-surface-elevated p-5 sm:p-8"
        >
          <CheckoutRulesFields
            checkoutLoginAck={page.checkoutLoginAck}
            setCheckoutLoginAck={page.setCheckoutLoginAck}
          />
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-brand-primary/10 pt-6">
            <button
              type="submit"
              disabled={page.saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {page.saving ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Save className="h-5 w-5 shrink-0" aria-hidden />
              )}
              {page.saving ? "Salvando…" : "Salvar regras de checkout"}
            </button>
          </div>
        </form>
      </FormProvider>

      <MercadoPagoCredentialsForm />
    </div>
  );
}
