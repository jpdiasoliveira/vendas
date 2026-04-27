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

export function useAdminSettings() {
  const navigate = useNavigate();
  const { refetch: refetchStoreSettings } = useStoreSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);
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

        await adminApiFetch("/api/admin/settings", {
          method: "PATCH",
          body: JSON.stringify({
            displayName: displayName.trim() || null,
            logoUrl: logoUrlFinal || null,
            minimumOrderValue: parseBRL(minimumOrderValue),
            primaryColor: primaryColor.trim() || null,
            publicProfile: {
              ...publicProfile,
              tagline: publicProfile.tagline?.trim() || undefined,
              requireLoginToCheckout: publicProfile.requireLoginToCheckout !== false,
            },
          }),
        });
        setImageFile(null);
        setImagePreview((prev) => {
          if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
          return null;
        });
        if (logoUrlFinal) setLogoUrl(logoUrlFinal);
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
    error,
    success,
    displayName,
    setDisplayName,
    logoUrl,
    setLogoUrl,
    imagePreview,
    logoPreviewFailed,
    setLogoPreviewFailed,
    minimumOrderValue,
    setMinimumOrderValue,
    primaryColor,
    setPrimaryColor,
    publicProfile,
    setPublicProfile,
    checkoutLoginAck,
    setCheckoutLoginAck,
    handleLogoFile,
    handleSubmit,
    inputCls,
    saveSuccessRef,
  };
}

export type AdminSettingsViewModel = ReturnType<typeof useAdminSettings>;
