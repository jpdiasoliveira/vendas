import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Loader2, PlugZap, Save } from "lucide-react";
import { useCallback, useState } from "react";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import { adminStorePaymentsQueryKey } from "@/react-app/query/queryKeys";
import { useAdminMeQuery } from "@/react-app/hooks/useAdminMeQuery";

export type StoreMpPaymentFlags = {
  mpAccessTokenConfigured: boolean;
  mpPublicKeyConfigured: boolean;
};

const inputCls =
  "mt-1 block w-full rounded-xl border border-[#1B4332]/20 bg-white px-3 py-2.5 font-mono text-sm text-[#1B4332] shadow-sm placeholder:text-[#6D4C41]/50 focus:border-[#1B4332]/40 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20";

export const AdminMercadoPagoCredentialsForm = () => {
  const qc = useQueryClient();
  const { data: me, isLoading: meLoading } = useAdminMeQuery();
  const isOwner = (me?.role ?? "").trim().toLowerCase() === "owner";
  const storeSlug = getEffectiveStoreSlug();
  const payKey = adminStorePaymentsQueryKey(storeSlug);

  const flagsQuery = useQuery({
    queryKey: payKey,
    queryFn: () => adminApiFetch<StoreMpPaymentFlags>("/api/admin/store/payments"),
    enabled: isOwner && !!storeSlug,
    staleTime: 30_000,
    retry: false,
  });

  const [tokenDraft, setTokenDraft] = useState("");
  const [pkDraft, setPkDraft] = useState("");
  const [tokenDirty, setTokenDirty] = useState(false);
  const [pkDirty, setPkDirty] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localOk, setLocalOk] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: { mpAccessToken?: string | null; mpPublicKey?: string | null } = {};
      if (tokenDirty) body.mpAccessToken = tokenDraft.trim() === "" ? null : tokenDraft.trim();
      if (pkDirty) body.mpPublicKey = pkDraft.trim() === "" ? null : pkDraft.trim();
      return adminApiFetch<StoreMpPaymentFlags>("/api/admin/store/payments", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (data) => {
      setLocalError(null);
      setLocalOk("Credenciais guardadas de forma cifrada. Os campos foram limpos por segurança.");
      setTokenDraft("");
      setPkDraft("");
      setTokenDirty(false);
      setPkDirty(false);
      qc.setQueryData(payKey, data);
    },
    onError: (e: unknown) => {
      setLocalOk(null);
      setLocalError(e instanceof Error ? e.message : String(e));
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const body: { mpAccessToken?: string } = {};
      const t = tokenDraft.trim();
      if (t) body.mpAccessToken = t;
      return adminApiFetch<{ ok: true; mpUserId: number | string; nickname?: string | null }>(
        "/api/admin/store/payments/test",
        { method: "POST", body: JSON.stringify(body) }
      );
    },
    onSuccess: (data) => {
      setLocalError(null);
      setLocalOk(
        `Conexão OK com o Mercado Pago (conta ${String(data.mpUserId)}${data.nickname ? ` — ${data.nickname}` : ""}).`
      );
    },
    onError: (e: unknown) => {
      setLocalOk(null);
      setLocalError(e instanceof Error ? e.message : String(e));
    },
  });

  const onMarkTokenDirty = useCallback(() => {
    setTokenDirty(true);
    setLocalOk(null);
  }, []);
  const onMarkPkDirty = useCallback(() => {
    setPkDirty(true);
    setLocalOk(null);
  }, []);

  if (meLoading) {
    return null;
  }
  if (!isOwner) {
    return (
      <div className="mt-10 w-full min-w-0 rounded-3xl border border-[#1B4332]/10 bg-white/90 p-6 font-inter text-sm text-[#6D4C41] shadow-sm backdrop-blur-sm">
        <p>
          <strong className="text-[#1B4332]">Mercado Pago:</strong> apenas o dono da loja pode configurar as chaves de
          pagamento.
        </p>
      </div>
    );
  }

  const flags = flagsQuery.data;

  return (
    <div className="mt-10 w-full min-w-0">
      <div className="mb-4 flex items-center gap-3">
        <KeyRound className="h-8 w-8 shrink-0 text-[#1B4332]" aria-hidden />
        <div>
          <h2 className="font-playfair text-2xl font-bold text-[#1B4332]">Mercado Pago</h2>
          <p className="mt-0.5 text-sm text-[#6D4C41]">
            Credenciais da <strong className="text-[#1B4332]">sua</strong> conta MP (cifradas no servidor). Nunca são
            mostradas de volta após gravar.
          </p>
        </div>
      </div>

      {flagsQuery.isError ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/95 p-4 text-sm text-amber-950">
          Não foi possível carregar o estado das chaves. Verifique se está logado como dono desta loja.
        </div>
      ) : null}

      {localError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 font-inter text-sm text-red-800">
          {localError}
        </div>
      ) : null}
      {localOk ? (
        <div
          className="mb-4 flex gap-3 rounded-2xl border border-green-200 bg-green-50/95 px-4 py-3 text-sm text-green-900"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
          <p>{localOk}</p>
        </div>
      ) : null}

      <div className="rounded-3xl border border-[#1B4332]/10 bg-white/90 p-5 font-inter shadow-sm backdrop-blur-sm sm:p-8">
        <div className="mb-6 flex flex-wrap gap-3 text-xs text-[#6D4C41]">
          <span className="rounded-full border border-[#1B4332]/15 bg-[#1B4332]/5 px-3 py-1">
            Access token: {flags?.mpAccessTokenConfigured ? "guardado" : "não configurado"}
          </span>
          <span className="rounded-full border border-[#1B4332]/15 bg-[#1B4332]/5 px-3 py-1">
            Public key: {flags?.mpPublicKeyConfigured ? "guardada" : "não configurada"}
          </span>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="mpAccessToken" className="block text-sm font-medium text-[#6D4C41]">
              Access Token (cole apenas para definir ou substituir)
            </label>
            <input
              id="mpAccessToken"
              name="mpAccessToken"
              type="password"
              autoComplete="off"
              value={tokenDraft}
              onChange={(e) => {
                setTokenDraft(e.target.value);
                onMarkTokenDirty();
              }}
              placeholder={flags?.mpAccessTokenConfigured ? "•••••••• (oculto) — cole um novo token para alterar" : "APP_USR-…"}
              className={inputCls}
            />
            <p className="mt-1 text-xs text-[#6D4C41]/80">
              Para <strong>remover</strong> o token guardado, apague o texto e grave (campo vazio = limpar).
            </p>
          </div>
          <div>
            <label htmlFor="mpPublicKey" className="block text-sm font-medium text-[#6D4C41]">
              Public Key (opcional; mesma regra de ocultação)
            </label>
            <input
              id="mpPublicKey"
              name="mpPublicKey"
              type="password"
              autoComplete="off"
              value={pkDraft}
              onChange={(e) => {
                setPkDraft(e.target.value);
                onMarkPkDirty();
              }}
              placeholder={flags?.mpPublicKeyConfigured ? "•••••••• (oculto)" : "APP_USR-… ou TEST-…"}
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#1B4332]/10 pt-6">
          <button
            type="button"
            disabled={saveMutation.isPending || flagsQuery.isLoading}
            onClick={() => {
              setLocalOk(null);
              if (!tokenDirty && !pkDirty) {
                setLocalError(
                  "Altere pelo menos um campo para gravar (ou apague o conteúdo para limpar um valor já guardado)."
                );
                return;
              }
              setLocalError(null);
              saveMutation.mutate();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123325] disabled:opacity-60"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Save className="h-5 w-5 shrink-0" aria-hidden />
            )}
            {saveMutation.isPending ? "A gravar…" : "Gravar credenciais"}
          </button>
          <button
            type="button"
            disabled={testMutation.isPending}
            onClick={() => {
              setLocalOk(null);
              setLocalError(null);
              testMutation.mutate();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1B4332]/25 bg-white px-5 py-2.5 text-sm font-semibold text-[#1B4332] shadow-sm transition hover:bg-[#1B4332]/5 disabled:opacity-60"
          >
            {testMutation.isPending ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
            ) : (
              <PlugZap className="h-5 w-5 shrink-0" aria-hidden />
            )}
            Testar conexão
          </button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[#6D4C41]/85">
          «Testar conexão» usa o texto do Access Token acima, se existir; caso contrário usa o token já guardado. O
          servidor precisa do segredo <code className="rounded bg-[#1B4332]/10 px-1">MP_STORE_CREDENTIALS_SECRET</code>{" "}
          (≥16 caracteres) para cifrar credenciais por loja.
        </p>
      </div>
    </div>
  );
};
