import { useCallback, useEffect, useState } from "react";

type FramingSession = { objectUrl: string; originalFileName: string };

export function useProductMediaState(isOpen: boolean) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [framingSession, setFramingSession] = useState<FramingSession | null>(null);

  const revokeBlob = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const reset = useCallback(() => {
    revokeBlob(previewUrl);
    setPreviewUrl(null);
    setImageFile(null);
    setFramingSession((prev) => {
      if (prev?.objectUrl.startsWith("blob:")) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
  }, [previewUrl, revokeBlob]);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const startFramingFromFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setFramingSession((prev) => {
      if (prev?.objectUrl.startsWith("blob:")) URL.revokeObjectURL(prev.objectUrl);
      return { objectUrl, originalFileName: file.name || "produto.jpg" };
    });
  };

  const completeFraming = (file: File) => {
    setFramingSession((prev) => {
      if (prev?.objectUrl.startsWith("blob:")) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
    revokeBlob(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImageFile(file);
  };

  const cancelFraming = () => {
    setFramingSession((prev) => {
      if (prev?.objectUrl.startsWith("blob:")) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
  };

  const openReframing = (fallbackUrl: string, fileName: string) => {
    if (framingSession) return;
    if (imageFile) {
      startFramingFromFile(imageFile);
      return;
    }
    if (/^https?:\/\//i.test(fallbackUrl)) {
      setFramingSession({ objectUrl: fallbackUrl, originalFileName: fileName });
    }
  };

  return {
    imageFile,
    previewUrl,
    framingSession,
    startFramingFromFile,
    completeFraming,
    cancelFraming,
    openReframing,
    reset,
  };
}
