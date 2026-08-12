import type { ImageCoverFramingKind } from "@/react-app/utils/imageCoverFraming";
import type { FieldPath } from "react-hook-form";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";

export type AdminProfileImageField =
  | "storyImageUrl"
  | "lifestyleLeftImageUrl"
  | "lifestyleRightImageUrl";

export const PROFILE_IMAGE_FIELDS: AdminProfileImageField[] = [
  "storyImageUrl",
  "lifestyleLeftImageUrl",
  "lifestyleRightImageUrl",
];

export function profileFieldToFramingKind(field: AdminProfileImageField): ImageCoverFramingKind {
  if (field === "storyImageUrl") return "story";
  if (field === "lifestyleLeftImageUrl") return "lifestyleLeft";
  return "lifestyleRight";
}

export function framingKindToProfileField(kind: ImageCoverFramingKind): AdminProfileImageField | null {
  if (kind === "story") return "storyImageUrl";
  if (kind === "lifestyleLeft") return "lifestyleLeftImageUrl";
  if (kind === "lifestyleRight") return "lifestyleRightImageUrl";
  return null;
}

export function profileImageFormPath(field: AdminProfileImageField): FieldPath<AdminSettingsFormValues> {
  return `publicProfile.${field}`;
}
