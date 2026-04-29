import { useCallback, useRef, useState } from "react";
import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";

/** Ao focar um campo, marca a secção; ao sair, limpa após um curto atraso (permite saltar entre campos da mesma secção). */
export const useStorefrontPreviewFocus = () => {
  const [activeSection, setActiveSection] = useState<StorefrontPreviewSectionId | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewFocus = useCallback((id: StorefrontPreviewSectionId) => {
    if (blurTimer.current != null) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setActiveSection(id);
  }, []);

  const previewBlur = useCallback(() => {
    if (blurTimer.current != null) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => {
      setActiveSection(null);
      blurTimer.current = null;
    }, 160);
  }, []);

  return { activeSection, previewFocus, previewBlur };
};
