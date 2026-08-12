import { Eye } from "lucide-react";
import {
  storefrontPreviewSectionLabels,
  type StorefrontPreviewSectionId,
} from "@/react-app/components/admin/storefrontPreviewLink";

type SettingsPreviewLinkHintProps = {
  section: StorefrontPreviewSectionId;
};

export function SettingsPreviewLinkHint({ section }: SettingsPreviewLinkHintProps) {
  return (
    <p className="mb-3 flex items-start gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-3 py-2 text-xs leading-snug text-content-muted">
      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
      <span>
        <span className="font-semibold text-content">Onde aparece na home:</span>{" "}
        {storefrontPreviewSectionLabels[section]}
      </span>
    </p>
  );
}
