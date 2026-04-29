import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Layers } from "lucide-react";
import {
  platformApiFetch,
  type PlatformCatalogFeatureDto,
  type PlatformEntitlementWriteRow,
  type PlatformPlansCatalogDto,
} from "@/react-app/services/api";

const TIER_LABEL: Record<string, string> = {
  tier_base: "Simples",
  tier_standard: "Pro",
  tier_unlimited: "VIP",
};

type FeatureDraft = {
  enabled: boolean;
  unlimited: boolean;
  intStr: string;
  boolOn: boolean;
};

const buildInitialDraft = (
  features: PlatformCatalogFeatureDto[],
  ent: { featureId: string; intValue: number | null; boolValue: boolean | null }[]
): Record<string, FeatureDraft> => {
  const byF = new Map(ent.map((e) => [e.featureId, e]));
  const out: Record<string, FeatureDraft> = {};
  for (const f of features) {
    const row = byF.get(f.id);
    const enabled = !!row;
    if (f.valueKind === "boolean") {
      out[f.id] = { enabled, unlimited: false, intStr: "0", boolOn: row?.boolValue === true };
    } else {
      const unlimited = enabled && row?.intValue == null;
      out[f.id] = {
        enabled,
        unlimited,
        intStr: row?.intValue != null ? String(row.intValue) : "50",
        boolOn: false,
      };
    }
  }
  return out;
};

const draftToPayload = (
  features: PlatformCatalogFeatureDto[],
  draft: Record<string, FeatureDraft>
): PlatformEntitlementWriteRow[] => {
  const payload: PlatformEntitlementWriteRow[] = [];
  for (const f of features) {
    const d = draft[f.id];
    if (!d?.enabled) continue;
    if (f.valueKind === "boolean") {
      payload.push({ featureId: f.id, intValue: null, boolValue: d.boolOn });
    } else if (d.unlimited) {
      payload.push({ featureId: f.id, intValue: null, boolValue: null });
    } else {
      const n = Number(d.intStr);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        throw new Error(`Valor numérico inválido para “${f.displayName}”.`);
      }
      payload.push({ featureId: f.id, intValue: n, boolValue: null });
    }
  }
  return payload;
};

const snapshotEntitlements = (drafts: Record<string, Record<string, FeatureDraft>>) => JSON.stringify({ drafts });

type PlatformPlansRulesEditorProps = {
  /** Chamado após persistência bem-sucedida (ex.: invalidar caches). */
  onSaved?: () => void;
};

/**
 * Editor de entitlements por plano (Bloco 2), embutido na página Planos e Regras.
 * A carência de assinatura vive em Configurações da plataforma (`PlatformGraceSettingsPanel`).
 */
export const PlatformPlansRulesEditor = ({ onSaved }: PlatformPlansRulesEditorProps) => {
  const [catalog, setCatalog] = useState<PlatformPlansCatalogDto | null>(null);
  const [draftsByVersion, setDraftsByVersion] = useState<Record<string, Record<string, FeatureDraft>>>({});
  const [baseline, setBaseline] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoadError(null);
    setSaveError(null);
    try {
      const cat = await platformApiFetch<PlatformPlansCatalogDto>("/api/platform/plans-catalog");
      setCatalog(cat);
      const drafts: Record<string, Record<string, FeatureDraft>> = {};
      for (const p of cat.plans) {
        if (!p.publicPriceVersion) continue;
        drafts[p.publicPriceVersion.id] = buildInitialDraft(cat.features, p.entitlements);
      }
      setDraftsByVersion(drafts);
      setBaseline(snapshotEntitlements(drafts));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Não foi possível carregar o catálogo.");
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const currentSnap = useMemo(() => snapshotEntitlements(draftsByVersion), [draftsByVersion]);
  const dirty = baseline != null && currentSnap !== baseline;

  const updateDraft = (versionId: string, featureId: string, patch: Partial<FeatureDraft>) => {
    setDraftsByVersion((prev) => {
      const planDraft = { ...(prev[versionId] ?? {}) };
      const cur = planDraft[featureId] ?? {
        enabled: false,
        unlimited: false,
        intStr: "0",
        boolOn: false,
      };
      planDraft[featureId] = { ...cur, ...patch };
      return { ...prev, [versionId]: planDraft };
    });
  };

  const runPersist = async () => {
    if (!catalog) return;
    setSaveError(null);
    setSaving(true);
    try {
      for (const p of catalog.plans) {
        const v = p.publicPriceVersion;
        if (!v) continue;
        const d = draftsByVersion[v.id];
        if (!d) continue;
        const payload = draftToPayload(catalog.features, d);
        await platformApiFetch(`/api/platform/plan-price-versions/${v.id}/entitlements`, {
          method: "PUT",
          body: JSON.stringify({ entitlements: payload }),
        });
      }
      await loadCatalog();
      onSaved?.();
      setConfirmOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Falha ao aplicar alterações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[color:var(--brand-primary)]/15 bg-white/95 shadow-sm">
      <div className="border-b border-[#1B4332]/10 bg-white/90 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-[var(--brand-primary)]">
          <Layers className="h-5 w-5 shrink-0" aria-hidden />
          <h2 className="font-playfair text-xl font-semibold text-[#1B4332] sm:text-2xl">O que cada plano inclui</h2>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Ajusta limites e opções por plano de preços. O prazo de tolerância após falha de pagamento está em{" "}
          <strong className="text-[#1B4332]">Configurações</strong>.
        </p>
      </div>

      <div className="px-5 py-4 sm:px-6 sm:py-5">
        {loadError ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
        ) : !catalog ? (
          <p className="text-sm text-slate-400">A carregar…</p>
        ) : (
          <div className="space-y-8">
            {catalog.features.length === 0 ? (
              <p className="text-sm text-slate-400">
                Ainda não há itens configuráveis no catálogo de benefícios. Contacta a equipa técnica para concluir a
                configuração inicial.
              </p>
            ) : (
              catalog.plans.map((p) => {
                const tier = TIER_LABEL[p.slug] ?? p.displayName;
                const v = p.publicPriceVersion;
                if (!v) {
                  return (
                    <section
                      key={p.planDefinitionId}
                      className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 text-sm text-amber-950"
                    >
                      <p className="font-semibold">{tier}</p>
                      <p className="mt-1 text-xs">Sem versão de preço pública ativa.</p>
                    </section>
                  );
                }
                const planDraft = draftsByVersion[v.id] ?? {};
                return (
                  <section
                    key={p.planDefinitionId}
                    className="rounded-2xl border border-[color:var(--brand-primary)]/12 bg-[#FAF8F3]/50 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-playfair text-lg font-semibold text-[#1B4332]">
                        {tier}{" "}
                        <span className="text-sm font-normal text-slate-400">({p.displayName})</span>
                      </h3>
                      <span className="text-xs text-slate-400">
                        Versão {v.versionSeq} · período de teste: {v.trialPeriodDays} dias
                      </span>
                    </div>
                    <ul className="mt-4 space-y-4">
                      {catalog.features.map((f) => {
                        const d = planDraft[f.id] ?? {
                          enabled: false,
                          unlimited: false,
                          intStr: "0",
                          boolOn: false,
                        };
                        return (
                          <li
                            key={f.id}
                            className="rounded-xl border border-slate-200/80 bg-white px-3 py-3 sm:px-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-[#1B4332]">{f.displayName}</p>
                                {f.description ? <p className="text-xs text-slate-400">{f.description}</p> : null}
                              </div>
                              <label className="flex shrink-0 items-center gap-2 text-sm text-[#1B4332]">
                                <input
                                  type="checkbox"
                                  checked={d.enabled}
                                  onChange={(e) => updateDraft(v.id, f.id, { enabled: e.target.checked })}
                                  className="h-4 w-4 rounded border-[#1B4332]/30"
                                />
                                Ativo neste plano
                              </label>
                            </div>
                            {d.enabled && f.valueKind === "boolean" ? (
                              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={d.boolOn}
                                  onChange={(e) => updateDraft(v.id, f.id, { boolOn: e.target.checked })}
                                  className="h-4 w-4 rounded border-[#1B4332]/30"
                                />
                                Ativar para as lojas deste plano
                              </label>
                            ) : null}
                            {d.enabled && f.valueKind === "integer" ? (
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                  <input
                                    type="checkbox"
                                    checked={d.unlimited}
                                    onChange={(e) => updateDraft(v.id, f.id, { unlimited: e.target.checked })}
                                    className="h-4 w-4 rounded border-[#1B4332]/30"
                                  />
                                  Sem limite numérico
                                </label>
                                {!d.unlimited ? (
                                  <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={d.intStr}
                                    onChange={(e) => updateDraft(v.id, f.id, { intStr: e.target.value })}
                                    className="w-28 rounded-lg border border-[#1B4332]/20 px-2 py-1.5 font-mono text-sm"
                                  />
                                ) : null}
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#1B4332]/10 bg-white/95 px-5 py-4 sm:px-6">
        {saveError ? <p className="mb-3 text-sm text-red-700">{saveError}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={!dirty || saving || !!loadError || !catalog}
            onClick={() => setConfirmOpen(true)}
            className="rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
          >
            Salvar alterações
          </button>
        </div>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setConfirmOpen(false)} aria-hidden />
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/50 bg-white p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-entitlements-title"
          >
            <div className="mb-3 flex justify-center">
              <div className="rounded-full bg-amber-100 p-3">
                <AlertTriangle className="h-8 w-8 text-amber-700" aria-hidden />
              </div>
            </div>
            <h3 id="confirm-entitlements-title" className="text-center font-playfair text-lg font-semibold text-[#1B4332]">
              Confirmar alteração nos direitos dos planos?
            </h3>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-400">
              <li>
                Os valores aplicam-se às versões de preço em vigor: as lojas ligadas a esses planos passam a receber
                estes limites e benefícios.
              </li>
              <li>Documente a alteração no teu fluxo interno (auditoria).</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-[#1B4332]/20 py-2.5 text-sm font-medium text-slate-600 hover:bg-[#FAF8F3] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void runPersist()}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? "A gravar…" : "Sim, aplicar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
