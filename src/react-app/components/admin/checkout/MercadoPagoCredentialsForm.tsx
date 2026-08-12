import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { KeyRound, Loader2, PlugZap, Save } from "lucide-react";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import { adminStorePaymentsQueryKey } from "@/react-app/query/queryKeys";
import { useAdminMeQuery } from "@/react-app/hooks/useAdminMeQuery";
import { useAdminMercadoPagoMutations } from "@/react-app/hooks/admin/settings/useAdminMercadoPagoMutations";
import { MercadoPagoStatusBadge } from "@/react-app/components/admin/checkout/MercadoPagoStatusBadge";
import { MercadoPagoFields } from "@/react-app/components/admin/checkout/MercadoPagoFields";
import {
  buildMercadoPagoPatchPayload,
  defaultMercadoPagoCredentialsFormValues,
  mercadoPagoCredentialsFormSchema,
  type MercadoPagoCredentialsFormValues,
  type StoreMpPaymentFlags,
} from "@/schemas/adminMercadoPago";
import { useToast } from "@/react-app/providers/ToastProvider";

function MercadoPagoCredentialsFormBody({
  flags,
  flagsLoading,
  storeSlug,
}: {
  flags: StoreMpPaymentFlags | undefined;
  flagsLoading: boolean;
  storeSlug: string;
}) {
  const { showToast } = useToast();
  const { saveMutation, testMutation } = useAdminMercadoPagoMutations(storeSlug);

  const form = useForm<MercadoPagoCredentialsFormValues>({
    resolver: zodResolver(mercadoPagoCredentialsFormSchema),
    defaultValues: defaultMercadoPagoCredentialsFormValues,
    mode: "onBlur",
  });

  const handleSave = (values: MercadoPagoCredentialsFormValues) => {
    const payload = buildMercadoPagoPatchPayload(values, form.formState.dirtyFields);
    if (!payload) {
      showToast({
        type: "error",
        message:
          "Altere pelo menos um campo para gravar (ou apague o conteúdo para limpar um valor já guardado).",
      });
      return;
    }
    saveMutation.mutate(payload, {
      onSuccess: () => {
        form.reset(defaultMercadoPagoCredentialsFormValues);
      },
    });
  };

  const handleTest = () => {
    const token = form.getValues("mpAccessToken").trim();
    testMutation.mutate(token ? { mpAccessToken: token } : {});
  };

  const saving = saveMutation.isPending;
  const testing = testMutation.isPending;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        <MercadoPagoStatusBadge flags={flags} />
        <MercadoPagoFields flags={flags} />
        <div className="flex flex-wrap items-center gap-3 border-t border-brand-primary/10 pt-6">
          <button
            type="submit"
            disabled={saving || flagsLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden /> : <Save className="h-5 w-5 shrink-0" aria-hidden />}
            {saving ? "A gravar…" : "Gravar credenciais"}
          </button>
          <button
            type="button"
            disabled={testing}
            onClick={handleTest}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-surface-elevated px-5 py-2.5 text-sm font-semibold text-content hover:bg-surface-muted disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden /> : <PlugZap className="h-5 w-5 shrink-0" aria-hidden />}
            Testar conexão
          </button>
        </div>
        <p className="text-xs leading-relaxed text-content-muted">
          «Testar conexão» usa o texto do Access Token acima, se existir; caso contrário usa o token já guardado. O
          servidor precisa do segredo{" "}
          <code className="rounded bg-surface-muted px-1 text-content">MP_STORE_CREDENTIALS_SECRET</code> (≥16
          caracteres) para cifrar credenciais por loja.
        </p>
      </form>
    </FormProvider>
  );
}

export function MercadoPagoCredentialsForm() {
  const { data: me, isLoading: meLoading } = useAdminMeQuery();
  const isOwner = (me?.role ?? "").trim().toLowerCase() === "owner";
  const storeSlug = getEffectiveStoreSlug() || "_";

  const flagsQuery = useQuery({
    queryKey: adminStorePaymentsQueryKey(storeSlug),
    queryFn: () => adminApiFetch<StoreMpPaymentFlags>("/api/admin/store/payments"),
    enabled: isOwner && !!storeSlug,
    staleTime: 30_000,
    retry: false,
  });

  if (meLoading) return null;

  if (!isOwner) {
    return (
      <div className="mt-10 w-full min-w-0 rounded-2xl border border-brand-primary/10 bg-surface-elevated p-6 text-sm text-content-muted">
        <p>
          <strong className="text-content">Mercado Pago:</strong> apenas o dono da loja pode configurar as chaves de
          pagamento.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 w-full min-w-0">
      <div className="mb-4 flex items-center gap-3">
        <KeyRound className="h-8 w-8 shrink-0 text-brand-primary" aria-hidden />
        <div>
          <h2 className="font-display text-2xl font-bold text-content">Mercado Pago</h2>
          <p className="mt-0.5 text-sm text-content-muted">
            Credenciais da <strong className="text-content">sua</strong> conta MP (cifradas no servidor). Nunca são
            mostradas de volta após gravar.
          </p>
        </div>
      </div>

      {flagsQuery.isError ? (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Não foi possível carregar o estado das chaves. Verifique se está logado como dono desta loja.
        </div>
      ) : null}

      <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-5 sm:p-8">
        <MercadoPagoCredentialsFormBody
          flags={flagsQuery.data}
          flagsLoading={flagsQuery.isLoading}
          storeSlug={storeSlug}
        />
      </div>
    </div>
  );
}
