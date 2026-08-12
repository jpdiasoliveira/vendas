import { FormProvider } from "react-hook-form";
import { Loader2, X } from "lucide-react";
import { NewStoreIdentitySection } from "@/react-app/components/platform/stores/NewStoreIdentitySection";
import { NewStoreOwnerSection } from "@/react-app/components/platform/stores/NewStoreOwnerSection";
import { NewStorePlanPicker } from "@/react-app/components/platform/stores/NewStorePlanPicker";
import { NewStoreSuccessPanel } from "@/react-app/components/platform/stores/NewStoreSuccessPanel";
import { usePlatformNewStoreForm } from "@/react-app/hooks/platform/usePlatformNewStoreForm";

type PlatformNewStoreModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function PlatformNewStoreModal({ isOpen, onClose, onCreated }: PlatformNewStoreModalProps) {
  const formState = usePlatformNewStoreForm(onCreated);

  const closeModal = () => {
    formState.resetAll();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
        aria-label="Fechar"
      />
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-brand-primary/20 bg-surface-elevated p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-new-store-title"
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 rounded-lg p-1 text-content-muted transition hover:bg-surface-muted hover:text-content"
          aria-label="Fechar"
        >
          <X className="h-6 w-6" aria-hidden />
        </button>

        <h2 id="platform-new-store-title" className="pr-10 font-display text-2xl font-semibold tracking-tight text-content">
          Nova loja
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-content-muted">
          Cria a loja, define o dono no Auth e escolhe o plano inicial — os campos estão agrupados por contexto.
        </p>

        {formState.created ? (
          <NewStoreSuccessPanel
            created={formState.created}
            onUseStore={formState.useThisStore}
            onClose={closeModal}
          />
        ) : (
          <FormProvider {...formState.form}>
            <form onSubmit={(e) => void formState.submit(e)} className="mt-6 space-y-6">
              <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
                <div className="space-y-5">
                  <NewStoreOwnerSection />
                  <NewStorePlanPicker />
                </div>
                <NewStoreIdentitySection
                  slugPreview={formState.slugPreview}
                  onDisplayBlur={formState.onDisplayBlur}
                  onSlugChange={formState.onSlugChange}
                  onSlugBlur={formState.onSlugBlur}
                />
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-brand-primary/10 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-brand-primary/20 px-5 py-2.5 text-sm font-medium text-content-muted transition hover:bg-surface-muted sm:min-w-[8rem]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formState.isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60 sm:min-w-[8rem]"
                >
                  {formState.isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A criar…
                    </>
                  ) : (
                    "Criar loja"
                  )}
                </button>
              </div>
            </form>
          </FormProvider>
        )}
      </div>
    </div>
  );
}
