import { Eye } from "lucide-react";
import {
  storefrontPreviewSectionLabels,
  type StorefrontPreviewSectionId,
} from "@/react-app/components/admin/storefrontPreviewLink";

type AdminPreviewLinkHintProps = {
  section: StorefrontPreviewSectionId;
};

export const AdminPreviewLinkHint = ({ section }: AdminPreviewLinkHintProps) => (
  <p className="mb-3 flex items-start gap-2 rounded-xl border border-[#FFD166]/45 bg-[#FFD166]/14 px-3 py-2 text-xs leading-snug text-[#5a4035]">
    <Eye className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" aria-hidden />
    <span>
      <span className="font-semibold text-[#1B4332]">Onde aparece na home:</span>{" "}
      {storefrontPreviewSectionLabels[section]}
    </span>
  </p>
);
