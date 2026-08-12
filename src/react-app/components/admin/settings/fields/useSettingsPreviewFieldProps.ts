import {
  adminPreviewScrollTargetId,
  type StorefrontPreviewSectionId,
} from "@/react-app/components/admin/storefrontPreviewLink";
import { useSettingsPreviewContext } from "@/react-app/components/admin/settings/SettingsPreviewContext";

export function useSettingsPreviewFieldProps(section?: StorefrontPreviewSectionId) {
  const { previewFocus, previewBlur } = useSettingsPreviewContext();
  if (!section) return {};
  return {
    "aria-controls": adminPreviewScrollTargetId(section),
    "data-admin-preview-section": section,
    onPointerDownCapture: () => previewFocus(section),
    onFocus: () => previewFocus(section),
    onBlur: previewBlur,
  } as const;
}
