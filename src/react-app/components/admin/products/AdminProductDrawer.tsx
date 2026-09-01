import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FormProvider } from "react-hook-form";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Save, X } from "lucide-react";
import type { Product } from "@/react-app/types";
import { adminUploadImage } from "@/react-app/services/api";
import { useAdminProductForm } from "@/react-app/hooks/admin/useAdminProductForm";
import { useAdminProductMutations } from "@/react-app/hooks/admin/useAdminProductMutations";
import { useAdminRoleGate } from "@/react-app/hooks/admin/useAdminRoleGate";
import { useProductMediaState } from "@/react-app/hooks/admin/useProductMediaState";
import { formValuesToCreatePayload, formValuesToUpdatePayload, type AdminProductFormValues } from "@/schemas/adminProductForm";
import { AdminProductDrawerTabs, type AdminProductDrawerTab } from "@/react-app/components/admin/products/AdminProductDrawerTabs";
import { AdminProductInfoTab } from "@/react-app/components/admin/products/tabs/AdminProductInfoTab";
import { AdminProductPricingTab } from "@/react-app/components/admin/products/tabs/AdminProductPricingTab";
import { AdminProductMediaTab } from "@/react-app/components/admin/products/tabs/AdminProductMediaTab";
import { AdminProductInventoryTab } from "@/react-app/components/admin/products/tabs/AdminProductInventoryTab";
import { ImageCoverFramingDrawer } from "@/react-app/components/admin/media/ImageCoverFramingDrawer";

type AdminProductDrawerProps = {
  mode: "create" | "edit";
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
  productLimitReached?: boolean;
};

export function AdminProductDrawer({ mode, isOpen, product, onClose, onSaved, productLimitReached }: AdminProductDrawerProps) {
  const form = useAdminProductForm({ mode, product, isOpen });
  const media = useProductMediaState(isOpen);
  const mutations = useAdminProductMutations();
  const { isAdminOrOwner } = useAdminRoleGate();
  const [tab, setTab] = useState<AdminProductDrawerTab>("info");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTab("info");
      setSubmitError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const imageUrl = form.watch("imageUrl") ?? "";
  const canReframe = Boolean(media.imageFile) || /^https?:\/\//i.test(imageUrl) || /^https?:\/\//i.test(product?.imageUrl ?? "");

  const onSubmit = form.handleSubmit(async (values: AdminProductFormValues) => {
    if (mode === "create" && productLimitReached) return;
    setSubmitError(null);
    setUploading(true);
    try {
      let finalUrl = values.imageUrl?.trim() ?? "";
      if (media.imageFile) {
        if (!isAdminOrOwner) {
          setSubmitError("Apenas administradores podem enviar arquivos. Use a URL da imagem.");
          return;
        }
        const { publicUrl } = await adminUploadImage(media.imageFile);
        finalUrl = publicUrl;
      }
      if (mode === "create") {
        await mutations.createMutation.mutateAsync(formValuesToCreatePayload(values, finalUrl));
      } else if (product) {
        await mutations.updateMutation.mutateAsync({
          productId: product.id,
          payload: formValuesToUpdatePayload(values, finalUrl),
        });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao salvar produto.");
    } finally {
      setUploading(false);
    }
  });

  if (typeof document === "undefined") return null;

  const saving = uploading || mutations.createMutation.isPending || mutations.updateMutation.isPending;
  const title = mode === "create" ? "Novo produto" : `Editar — ${form.watch("title") || product?.name || ""}`;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button type="button" aria-label="Fechar" className="fixed inset-0 z-[80] bg-surface/75 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.aside role="dialog" aria-modal="true" aria-label={title} className="fixed right-0 top-0 z-[81] flex h-[100dvh] w-full max-w-[100vw] flex-col border-l border-brand-primary/15 bg-surface shadow-2xl sm:max-w-xl lg:max-w-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 360, damping: 36 }}>
              <div className="flex items-center justify-between gap-3 border-b border-brand-primary/10 px-4 py-3 sm:px-5">
                <h2 className="min-w-0 truncate font-display text-lg font-bold text-content">{title}</h2>
                <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-content-muted hover:bg-surface-muted hover:text-content" aria-label="Fechar"><X className="h-5 w-5" /></button>
              </div>
              <FormProvider {...form}>
                <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
                  <AdminProductDrawerTabs active={tab} onChange={setTab} />
                  <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                    {productLimitReached && mode === "create" ? (
                      <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">Limite de produtos do plano atingido.</p>
                    ) : null}
                    {submitError ? <p className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200" role="alert">{submitError}</p> : null}
                    {tab === "info" ? <AdminProductInfoTab /> : null}
                    {tab === "pricing" ? <AdminProductPricingTab /> : null}
                    {tab === "media" ? (
                      <AdminProductMediaTab
                        previewUrl={media.previewUrl}
                        imageUrl={imageUrl}
                        canReframe={canReframe}
                        canUploadImages={isAdminOrOwner}
                        onPickFile={media.startFramingFromFile}
                        onReframe={() => media.openReframing(imageUrl || product?.imageUrl || "", `${form.watch("title") || "produto"}.jpg`)}
                      />
                    ) : null}
                    {tab === "inventory" ? <AdminProductInventoryTab /> : null}
                  </div>
                  <div className="flex gap-2 border-t border-brand-primary/10 px-4 py-3 sm:px-5">
                    <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-brand-primary/15 bg-surface-elevated py-2.5 text-sm font-medium text-content-muted hover:bg-surface-muted">Cancelar</button>
                    <button type="submit" disabled={saving || (mode === "create" && productLimitReached)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar
                    </button>
                  </div>
                </form>
              </FormProvider>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
      {media.framingSession ? (
        <ImageCoverFramingDrawer open kind="product" imageSrc={media.framingSession.objectUrl} originalFileName={media.framingSession.originalFileName} onClose={media.cancelFraming} onConfirm={media.completeFraming} />
      ) : null}
    </>,
    document.body,
  );
}
