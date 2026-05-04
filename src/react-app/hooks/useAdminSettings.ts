import { useState, useEffect, useCallback, useRef, type FormEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch, adminUploadImage, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { StoreSettingsData } from "@/react-app/contexts/StoreSettingsContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import type { StorePublicProfile } from "@/react-app/types";
import { parsePublicProfile } from "@/contracts/storePublicProfile";
import { clampStoreLogoHeightPx } from "@/react-app/utils/storeLogoDisplay";
import type { ImageCoverFramingKind } from "@/react-app/utils/imageCoverFraming";
import { formatBrazilPhoneInput } from "@/react-app/utils/phoneBr";
import { formatBRL, parseBRL } from "@/react-app/utils/adminSettingsBrl";
import { adminStoreSettingsFormQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";

const emptyProfile = (): StorePublicProfile => parsePublicProfile({});

/** Snapshot estável do GET /api/admin/settings para não sobrescrever o formulário em refetches idênticos (ex.: após upload local da imagem da história). */
const adminSettingsServerSnapshot = (data: StoreSettingsData): string =>
  JSON.stringify({
    displayName: data.displayName ?? null,
    logoUrl: data.logoUrl ?? null,
    bannerUrl: data.bannerUrl ?? null,
    primaryColor: data.primaryColor ?? null,
    minimumOrderValue: data.minimumOrderValue ?? null,
    publicProfile: data.publicProfile ?? {},
  });

/** Campos da home em `public_profile` que aceitam upload de imagem (URL preenchida após envio). */
export type AdminProfileImageField = "storyImageUrl" | "lifestyleLeftImageUrl" | "lifestyleRightImageUrl";

function profileFieldToFramingKind(field: AdminProfileImageField): ImageCoverFramingKind {
  if (field === "storyImageUrl") return "story";
  if (field === "lifestyleLeftImageUrl") return "lifestyleLeft";
  return "lifestyleRight";
}

export type AdminImageFramingSession = {
  kind: ImageCoverFramingKind;
  objectUrl: string;
  originalFileName: string;
  /** Preenchido para história / lifestyle: após confirmar, faz upload e grava URL em `publicProfile`. */
  profileField?: AdminProfileImageField;
};

export const useAdminSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { refetch: refetchStoreSettings } = useStoreSettings();
  const storeSlug = getEffectiveStoreSlug();

  const settingsQuery = useQuery({
    queryKey: adminStoreSettingsFormQueryKey(storeSlug || "_"),
    queryFn: () => adminApiFetch<StoreSettingsData>("/api/admin/settings"),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });

  const loading = settingsQuery.isPending && settingsQuery.data === undefined;
  const loadError =
    settingsQuery.isError
      ? settingsQuery.error instanceof Error
        ? settingsQuery.error.message
        : String(settingsQuery.error)
      : null;

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState<AdminProfileImageField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [minimumOrderValue, setMinimumOrderValue] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1B4332");
  const [publicProfile, setPublicProfile] = useState<StorePublicProfile>(emptyProfile);
  const [checkoutLoginAck, setCheckoutLoginAck] = useState<string | null>(null);
  const [imageFramingSession, setImageFramingSession] = useState<AdminImageFramingSession | null>(null);

  const lastHydratedServerSnapshot = useRef<string>("");

  useEffect(() => {
    if (!storeSlug) lastHydratedServerSnapshot.current = "";
  }, [storeSlug]);

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data) return;
    const snap = adminSettingsServerSnapshot(data);
    if (lastHydratedServerSnapshot.current === snap) return;
    lastHydratedServerSnapshot.current = snap;
    setDisplayName(data.displayName ?? "");
    setLogoUrl(data.logoUrl ?? "");
    setBannerUrl(data.bannerUrl ?? "");
    setMinimumOrderValue(data.minimumOrderValue != null ? formatBRL(data.minimumOrderValue) : "");
    setPrimaryColor(
      data.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(data.primaryColor) ? data.primaryColor : "#1B4332"
    );
    const parsed = parsePublicProfile(data.publicProfile ?? {});
    setPublicProfile({
      ...parsed,
      contactWhatsapp: parsed.contactWhatsapp ? formatBrazilPhoneInput(parsed.contactWhatsapp) : null,
      contactPhone: parsed.contactPhone ? formatBrazilPhoneInput(parsed.contactPhone) : null,
    });
  }, [settingsQuery.data]);

  useEffect(() => {
    if (!success) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t = setTimeout(() => setSuccess(false), 8000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    setLogoPreviewFailed(false);
  }, [imagePreview, logoUrl]);

  const handleLogoFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setImageFramingSession({
      kind: "logo",
      objectUrl,
      originalFileName: file.name || "logo",
    });
  }, []);

  const handleBannerFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setImageFramingSession({
      kind: "banner",
      objectUrl,
      originalFileName: file.name || "banner",
    });
  }, []);

  const cancelImageFraming = useCallback(() => {
    setImageFramingSession((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
  }, []);

  const completeImageFramingFromSession = useCallback(async (session: AdminImageFramingSession, file: File) => {
    URL.revokeObjectURL(session.objectUrl);
    if (session.kind === "banner") {
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return previewUrl;
      });
      setBannerFile(file);
      setImageFramingSession(null);
      return;
    }
    if (session.kind === "logo") {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return previewUrl;
      });
      setImageFile(file);
      setImageFramingSession(null);
      return;
    }
    if (session.profileField) {
      const field = session.profileField;
      setImageFramingSession(null);
      setUploadingProfileImage(field);
      try {
        const { publicUrl } = await adminUploadImage(file);
        setPublicProfile((prev) => ({ ...prev, [field]: publicUrl }));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao enviar imagem");
      } finally {
        setUploadingProfileImage(null);
      }
      return;
    }
    setImageFramingSession(null);
  }, []);

  const handleProfileImageFile = useCallback((field: AdminProfileImageField) => {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setError(null);
      const objectUrl = URL.createObjectURL(file);
      setImageFramingSession({
        kind: profileFieldToFramingKind(field),
        objectUrl,
        originalFileName: file.name || "imagem",
        profileField: field,
      });
    };
  }, []);

  const inputCls =
    "w-full scroll-mt-24 px-4 py-2.5 rounded-xl border border-[#1B4332]/20 bg-white text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]";

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setSaving(true);
      try {
        let logoUrlFinal = logoUrl.trim();
        if (imageFile) {
          setUploadingImage(true);
          try {
            const { publicUrl } = await adminUploadImage(imageFile);
            logoUrlFinal = publicUrl;
          } finally {
            setUploadingImage(false);
          }
        }

        let bannerUrlFinal = bannerUrl.trim();
        if (bannerFile) {
          setUploadingBanner(true);
          try {
            const { publicUrl } = await adminUploadImage(bannerFile);
            bannerUrlFinal = publicUrl;
          } finally {
            setUploadingBanner(false);
          }
        }

        await adminApiFetch("/api/admin/settings", {
          method: "PATCH",
          body: JSON.stringify({
            displayName: displayName.trim() || null,
            logoUrl: logoUrlFinal || null,
            bannerUrl: bannerUrlFinal || null,
            minimumOrderValue: parseBRL(minimumOrderValue),
            primaryColor: primaryColor.trim() || null,
            publicProfile: {
              ...publicProfile,
              tagline: publicProfile.tagline?.trim() || undefined,
              heroBadge: publicProfile.heroBadge?.trim() || undefined,
              heroTitle: publicProfile.heroTitle?.trim() || undefined,
              heroSubtitle: publicProfile.heroSubtitle?.trim() || undefined,
              heroCtaLabel: publicProfile.heroCtaLabel?.trim() || undefined,
              storyEyebrow: publicProfile.storyEyebrow?.trim() || undefined,
              storyHeading: publicProfile.storyHeading?.trim() || undefined,
              storyBody: publicProfile.storyBody?.trim() || undefined,
              storyImageUrl: publicProfile.storyImageUrl?.trim() || undefined,
              storyChip1: publicProfile.storyChip1?.trim() || undefined,
              storyChip2: publicProfile.storyChip2?.trim() || undefined,
              lifestyleEyebrow: publicProfile.lifestyleEyebrow?.trim() || undefined,
              lifestyleTitle: publicProfile.lifestyleTitle?.trim() || undefined,
              lifestyleSubtitle: publicProfile.lifestyleSubtitle?.trim() || undefined,
              lifestyleLeftImageUrl: publicProfile.lifestyleLeftImageUrl?.trim() || undefined,
              lifestyleLeftTitle:
                publicProfile.lifestyleLeftTitle === undefined || publicProfile.lifestyleLeftTitle === null
                  ? undefined
                  : publicProfile.lifestyleLeftTitle.trim(),
              lifestyleLeftText:
                publicProfile.lifestyleLeftText === undefined || publicProfile.lifestyleLeftText === null
                  ? undefined
                  : publicProfile.lifestyleLeftText.trim(),
              lifestyleRightImageUrl: publicProfile.lifestyleRightImageUrl?.trim() || undefined,
              lifestyleRightTitle:
                publicProfile.lifestyleRightTitle === undefined || publicProfile.lifestyleRightTitle === null
                  ? undefined
                  : publicProfile.lifestyleRightTitle.trim(),
              lifestyleRightText:
                publicProfile.lifestyleRightText === undefined || publicProfile.lifestyleRightText === null
                  ? undefined
                  : publicProfile.lifestyleRightText.trim(),
              benefit1Title: publicProfile.benefit1Title?.trim() || undefined,
              benefit1Text: publicProfile.benefit1Text?.trim() || undefined,
              benefit2Title: publicProfile.benefit2Title?.trim() || undefined,
              benefit2Text: publicProfile.benefit2Text?.trim() || undefined,
              benefit3Title: publicProfile.benefit3Title?.trim() || undefined,
              benefit3Text: publicProfile.benefit3Text?.trim() || undefined,
              newsletterEyebrow: publicProfile.newsletterEyebrow?.trim() || undefined,
              newsletterTitle: publicProfile.newsletterTitle?.trim() || undefined,
              newsletterSubtitle: publicProfile.newsletterSubtitle?.trim() || undefined,
              newsletterPlaceholder: publicProfile.newsletterPlaceholder?.trim() || undefined,
              newsletterCtaLabel: publicProfile.newsletterCtaLabel?.trim() || undefined,
              productsGridEyebrow: publicProfile.productsGridEyebrow?.trim() || undefined,
              productsGridTitle: publicProfile.productsGridTitle?.trim() || undefined,
              productsGridSubtitle: publicProfile.productsGridSubtitle?.trim() || undefined,
              requireLoginToCheckout: publicProfile.requireLoginToCheckout !== false,
              logoHeightPx: clampStoreLogoHeightPx(publicProfile.logoHeightPx ?? undefined),
              logoKnockoutWhite: publicProfile.logoKnockoutWhite === true,
              accentColor:
                publicProfile.accentColor && /^#[0-9A-Fa-f]{6}$/i.test(publicProfile.accentColor.trim())
                  ? publicProfile.accentColor.trim().startsWith("#")
                    ? publicProfile.accentColor.trim()
                    : `#${publicProfile.accentColor.trim()}`
                  : undefined,
              businessHoursHidden: publicProfile.businessHoursHidden === true ? true : undefined,
              shippingInfoHidden: publicProfile.shippingInfoHidden === true ? true : undefined,
              deliveryPolicyHidden: publicProfile.deliveryPolicyHidden === true ? true : undefined,
              returnsPolicyHidden: publicProfile.returnsPolicyHidden === true ? true : undefined,
              privacyPolicyHidden: publicProfile.privacyPolicyHidden === true ? true : undefined,
            },
          }),
        });
        setImageFile(null);
        setImagePreview((prev) => {
          if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
          return null;
        });
        setBannerFile(null);
        setBannerPreview((prev) => {
          if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
          return null;
        });
        if (logoUrlFinal) setLogoUrl(logoUrlFinal);
        if (bannerUrlFinal) setBannerUrl(bannerUrlFinal);
        setCheckoutLoginAck(null);
        setSuccess(true);
        void queryClient.invalidateQueries({ queryKey: ["admin", "store-settings-form"] });
        await refetchStoreSettings({ silent: true });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      } finally {
        setSaving(false);
      }
    },
    [
      displayName,
      imageFile,
      logoUrl,
      bannerUrl,
      bannerFile,
      minimumOrderValue,
      primaryColor,
      publicProfile,
      refetchStoreSettings,
      queryClient,
    ]
  );

  const combinedError = error ?? loadError;

  return {
    navigate,
    loading,
    saving,
    uploadingImage,
    uploadingBanner,
    uploadingProfileImage,
    error: combinedError,
    success,
    displayName,
    setDisplayName,
    logoUrl,
    setLogoUrl,
    imagePreview,
    logoPreviewFailed,
    setLogoPreviewFailed,
    bannerUrl,
    setBannerUrl,
    bannerPreview,
    minimumOrderValue,
    setMinimumOrderValue,
    primaryColor,
    setPrimaryColor,
    publicProfile,
    setPublicProfile,
    checkoutLoginAck,
    setCheckoutLoginAck,
    handleLogoFile,
    handleBannerFile,
    imageFramingSession,
    cancelImageFraming,
    completeImageFramingFromSession,
    handleProfileImageFile,
    handleSubmit,
    inputCls,
  };
};

export type AdminSettingsViewModel = ReturnType<typeof useAdminSettings>;
