import { useState, useEffect, useRef, useCallback, type FormEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { adminApiFetch, adminUploadImage } from "@/react-app/services/api";
import type { StoreSettingsData } from "@/react-app/contexts/StoreSettingsContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import type { StorePublicProfile } from "@/react-app/types";
import { parsePublicProfile } from "@/worker/core/storePublicProfile";
import { formatBrazilPhoneInput } from "@/react-app/utils/phoneBr";
import { formatBRL, parseBRL } from "@/react-app/utils/adminSettingsBrl";

const emptyProfile = (): StorePublicProfile => parsePublicProfile({});

/** Campos da home em `public_profile` que aceitam upload de imagem (URL preenchida após envio). */
export type AdminProfileImageField = "storyImageUrl" | "lifestyleLeftImageUrl" | "lifestyleRightImageUrl";

export const useAdminSettings = () => {
  const navigate = useNavigate();
  const { refetch: refetchStoreSettings } = useStoreSettings();
  const [loading, setLoading] = useState(true);
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
  const saveSuccessRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    adminApiFetch<StoreSettingsData>("/api/admin/settings")
      .then((data) => {
        if (!mounted) return;
        setDisplayName(data?.displayName ?? "");
        setLogoUrl(data?.logoUrl ?? "");
        setBannerUrl(data?.bannerUrl ?? "");
        setMinimumOrderValue(data?.minimumOrderValue != null ? formatBRL(data.minimumOrderValue) : "");
        setPrimaryColor(
          data?.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(data.primaryColor) ? data.primaryColor : "#1B4332"
        );
        const parsed = parsePublicProfile(data?.publicProfile ?? {});
        setPublicProfile({
          ...parsed,
          contactWhatsapp: parsed.contactWhatsapp
            ? formatBrazilPhoneInput(parsed.contactWhatsapp)
            : null,
          contactPhone: parsed.contactPhone ? formatBrazilPhoneInput(parsed.contactPhone) : null,
        });
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Erro ao carregar configurações");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!success) return;
    const id = requestAnimationFrame(() => {
      saveSuccessRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    const t = setTimeout(() => setSuccess(false), 8000);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [success]);

  useEffect(() => {
    setLogoPreviewFailed(false);
  }, [imagePreview, logoUrl]);

  const handleLogoFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setImageFile(file ?? null);
  }, []);

  const handleBannerFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setBannerPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setBannerFile(file ?? null);
  }, []);

  const handleProfileImageFile = useCallback((field: AdminProfileImageField) => {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setError(null);
      setUploadingProfileImage(field);
      adminUploadImage(file)
        .then(({ publicUrl }) => {
          setPublicProfile((prev) => ({ ...prev, [field]: publicUrl }));
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Erro ao enviar imagem");
        })
        .finally(() => {
          setUploadingProfileImage(null);
        });
    };
  }, []);

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-[#1B4332]/20 bg-white text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]";

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
              lifestyleLeftTitle: publicProfile.lifestyleLeftTitle?.trim() || undefined,
              lifestyleLeftText: publicProfile.lifestyleLeftText?.trim() || undefined,
              lifestyleRightImageUrl: publicProfile.lifestyleRightImageUrl?.trim() || undefined,
              lifestyleRightTitle: publicProfile.lifestyleRightTitle?.trim() || undefined,
              lifestyleRightText: publicProfile.lifestyleRightText?.trim() || undefined,
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
              requireLoginToCheckout: publicProfile.requireLoginToCheckout !== false,
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
    ]
  );

  return {
    navigate,
    loading,
    saving,
    uploadingImage,
    uploadingBanner,
    uploadingProfileImage,
    error,
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
    handleProfileImageFile,
    handleSubmit,
    inputCls,
    saveSuccessRef,
  };
};

export type AdminSettingsViewModel = ReturnType<typeof useAdminSettings>;
