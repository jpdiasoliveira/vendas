import { useCallback, useRef, useState } from "react";
import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";

/**
 * Ao focar um campo, marca a secção; ao sair, limpa após um curto atraso.
 * `previewScrollTick` incrementa a cada ativação para voltar a rolar a pré-visualização
 * ao clicar no mesmo campo (o browser não dispara `focus` de novo se já estiver focado).
 */
export const useStorefrontPreviewFocus = () => {
  const [activeSection, setActiveSection] = useState<StorefrontPreviewSectionId | null>(null);
  const [previewScrollTick, setPreviewScrollTick] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewFocus = useCallback((id: StorefrontPreviewSectionId) => {
    if (blurTimer.current != null) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setActiveSection(id);
    setPreviewScrollTick((t) => t + 1);
  }, []);

  const previewBlur = useCallback(() => {
    if (blurTimer.current != null) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => {
      setActiveSection(null);
      blurTimer.current = null;
    }, 160);
  }, []);

  /** Realça a secção na pré-visualização sem incrementar o tick (evita re-rolar o painel ao clicar no preview). */
  const previewMarkSection = useCallback((id: StorefrontPreviewSectionId | null) => {
    if (blurTimer.current != null) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setActiveSection(id);
  }, []);

  return { activeSection, previewScrollTick, previewFocus, previewBlur, previewMarkSection };
};
