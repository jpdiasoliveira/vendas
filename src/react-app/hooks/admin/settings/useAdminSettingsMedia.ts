import { useCallback, useEffect, useState, type ChangeEvent } from "react";

import type { ImageCoverFramingKind } from "@/react-app/utils/imageCoverFraming";

import {

  framingKindToProfileField,

  profileFieldToFramingKind,

  type AdminProfileImageField,

} from "@/react-app/hooks/admin/settings/adminSettingsProfileImages";



export type AdminSettingsFramingSession = {

  kind: ImageCoverFramingKind;

  objectUrl: string;

  originalFileName: string;

};



export function useAdminSettingsMedia() {

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);

  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [profileImageFiles, setProfileImageFiles] = useState<Partial<Record<AdminProfileImageField, File>>>({});

  const [profileImagePreviews, setProfileImagePreviews] = useState<Partial<Record<AdminProfileImageField, string>>>({});

  const [framingSession, setFramingSession] = useState<AdminSettingsFramingSession | null>(null);



  const revokeBlob = useCallback((url: string | null) => {

    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);

  }, []);



  const revokeProfilePreviews = useCallback(() => {

    for (const url of Object.values(profileImagePreviews)) {

      revokeBlob(url ?? null);

    }

  }, [profileImagePreviews, revokeBlob]);



  const clearPendingUploads = useCallback(() => {

    revokeBlob(logoPreview);

    revokeBlob(bannerPreview);

    revokeProfilePreviews();

    setLogoPreview(null);

    setBannerPreview(null);

    setLogoFile(null);

    setBannerFile(null);

    setProfileImageFiles({});

    setProfileImagePreviews({});

  }, [bannerPreview, logoPreview, revokeBlob, revokeProfilePreviews]);



  useEffect(() => {

    setLogoPreviewFailed(false);

  }, [logoPreview]);



  const startFraming = (kind: ImageCoverFramingKind, file: File) => {

    const objectUrl = URL.createObjectURL(file);

    setFramingSession((prev) => {

      if (prev) revokeBlob(prev.objectUrl);

      return { kind, objectUrl, originalFileName: file.name || kind };

    });

  };



  const handleLogoFile = (e: ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    e.target.value = "";

    if (file) startFraming("logo", file);

  };



  const handleBannerFile = (e: ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    e.target.value = "";

    if (file) startFraming("banner", file);

  };



  const handleProfileImageFile = (field: AdminProfileImageField) => (e: ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    e.target.value = "";

    if (file) startFraming(profileFieldToFramingKind(field), file);

  };



  const cancelFraming = () => {

    setFramingSession((prev) => {

      if (prev) revokeBlob(prev.objectUrl);

      return null;

    });

  };



  const completeFraming = (file: File) => {

    setFramingSession((prev) => {

      if (!prev) return null;

      revokeBlob(prev.objectUrl);

      const previewUrl = URL.createObjectURL(file);

      const profileField = framingKindToProfileField(prev.kind);



      if (profileField) {

        setProfileImagePreviews((old) => {

          revokeBlob(old[profileField] ?? null);

          return { ...old, [profileField]: previewUrl };

        });

        setProfileImageFiles((old) => ({ ...old, [profileField]: file }));

      } else if (prev.kind === "logo") {

        revokeBlob(logoPreview);

        setLogoPreview(previewUrl);

        setLogoFile(file);

      } else if (prev.kind === "banner") {

        revokeBlob(bannerPreview);

        setBannerPreview(previewUrl);

        setBannerFile(file);

      }

      return null;

    });

  };



  const getProfileImagePreview = (field: AdminProfileImageField, formValue: string) =>

    profileImagePreviews[field] ?? formValue;



  return {

    logoFile,

    logoPreview,

    logoPreviewFailed,

    setLogoPreviewFailed,

    bannerFile,

    bannerPreview,

    profileImageFiles,

    profileImagePreviews,

    framingSession,

    handleLogoFile,

    handleBannerFile,

    handleProfileImageFile,

    getProfileImagePreview,

    cancelFraming,

    completeFraming,

    clearPendingUploads,

  };

}

