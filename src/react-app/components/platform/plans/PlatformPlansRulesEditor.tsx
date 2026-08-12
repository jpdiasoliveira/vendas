import { useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { PlanTierEntitlementsSection } from "@/react-app/components/platform/plans/PlanTierEntitlementsSection";
import { PlatformConfirmDialog } from "@/react-app/components/platform/shared/PlatformConfirmDialog";
import { usePlatformPlansEditor } from "@/react-app/hooks/platform/usePlatformPlansEditor";
import { usePlatformPlansSaveMutation } from "@/react-app/hooks/platform/usePlatformPlansSaveMutation";

export function PlatformPlansRulesEditor() {
  const editor = usePlatformPlansEditor();
  const saveMutation = usePlatformPlansSaveMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = async () => {
    if (!editor.catalog || editor.dirtyVersionIds.length === 0) return;
    await saveMutation.mutateAsync({
      catalog: editor.catalog,
      draftsByVersion: editor.draftsByVersion,
      dirtyVersionIds: editor.dirtyVersionIds,
    });
    setConfirmOpen(false);
  };

  return (
    <div className="rounded-3xl border border-brand-primary/15 bg-surface shadow-sm">
      <div className="border-b border-brand-primary/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-brand-primary">
          <Layers className="h-5 w-5 shrink-0" aria-hidden />
          <h2 className="font-display text-xl font-semibold text-content sm:text-2xl">O que cada plano inclui</h2>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-content-muted">
          Ajusta limites e opções por plano de preços. O prazo de tolerância após falha de pagamento está em{" "}
          <strong className="text-content">Configurações</strong>.
        </p>
      </div>

      <div className="px-5 py-4 sm:px-6 sm:py-5">
        {editor.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-content-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
          </p>
        ) : !editor.catalog ? (
          <p className="text-sm text-content-muted">Catálogo indisponível.</p>
        ) : editor.catalog.features.length === 0 ? (
          <p className="text-sm text-content-muted">
            Ainda não há itens configuráveis no catálogo de benefícios. Contacta a equipa técnica para concluir a
            configuração inicial.
          </p>
        ) : (
          <div className="space-y-8">
            {editor.catalog.plans.map((plan) => {
              const versionId = plan.publicPriceVersion?.id;
              return (
                <PlanTierEntitlementsSection
                  key={plan.planDefinitionId}
                  plan={plan}
                  features={editor.catalog!.features}
                  planDraft={versionId ? (editor.draftsByVersion[versionId] ?? {}) : {}}
                  onUpdateDraft={(featureId, patch) => {
                    if (!versionId) return;
                    editor.updateDraft(versionId, featureId, patch);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-brand-primary/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={!editor.isDirty || saveMutation.isPending || editor.isLoading || !editor.catalog}
            onClick={() => setConfirmOpen(true)}
            className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
          >
            Salvar alterações
          </button>
        </div>
      </div>

      <PlatformConfirmDialog
        open={confirmOpen}
        title="Confirmar alteração nos direitos dos planos?"
        loading={saveMutation.isPending}
        confirmLabel="Sim, aplicar"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleSave()}
      >
        <ul className="list-inside list-disc space-y-2">
          <li>
            Os valores aplicam-se às versões de preço em vigor: as lojas ligadas a esses planos passam a receber estes
            limites e benefícios.
          </li>
          <li>Documente a alteração no teu fluxo interno (auditoria).</li>
        </ul>
      </PlatformConfirmDialog>
    </div>
  );
}
