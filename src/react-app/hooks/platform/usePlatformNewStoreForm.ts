import { useCallback, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  defaultPlatformCreateStoreFormValues,
  normalizeStoreSlugInput,
  platformCreateStoreFormSchema,
  type PlatformCreateStoreBody,
  type PlatformCreateStoreFormValues,
} from "@/schemas/platformCreateStore";
import { useToast } from "@/react-app/providers/ToastProvider";
import { platformApiFetch, setStoreSlugOverride, type CreatedPlatformStore } from "@/react-app/services/api";

export const usePlatformNewStoreForm = (onCreated?: () => void) => {
  const { showToast } = useToast();
  const [slugTouched, setSlugTouched] = useState(false);
  const [created, setCreated] = useState<CreatedPlatformStore | null>(null);

  const form = useForm<PlatformCreateStoreFormValues, unknown, PlatformCreateStoreBody>({
    resolver: zodResolver(platformCreateStoreFormSchema),
    defaultValues: defaultPlatformCreateStoreFormValues,
    mode: "onBlur",
  });

  const slugValue = form.watch("slug");
  const slugPreview = useMemo(() => normalizeStoreSlugInput(slugValue), [slugValue]);

  const mutation = useMutation({
    mutationFn: (body: PlatformCreateStoreBody) =>
      platformApiFetch<CreatedPlatformStore>("/api/platform/stores", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      setCreated(data);
      onCreated?.();
      showToast({ type: "success", message: `Loja “${data.displayName}” criada com sucesso.` });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Não foi possível criar a loja.";
      showToast({ type: "error", message });
    },
  });

  const resetAll = useCallback(() => {
    form.reset(defaultPlatformCreateStoreFormValues);
    setSlugTouched(false);
    setCreated(null);
    mutation.reset();
  }, [form, mutation]);

  const onDisplayBlur = useCallback(() => {
    if (slugTouched) return;
    const displayName = form.getValues("displayName").trim();
    if (!displayName) return;
    const nextSlug = normalizeStoreSlugInput(displayName);
    if (nextSlug.length >= 2) form.setValue("slug", nextSlug, { shouldDirty: true });
  }, [form, slugTouched]);

  const onSlugChange = useCallback(
    (value: string) => {
      setSlugTouched(true);
      let normalized = value.toLowerCase();
      normalized = normalized.normalize("NFD").replace(/\p{Diacritic}/gu, "");
      normalized = normalized.replace(/[^a-z0-9-]/g, "");
      form.setValue("slug", normalized, { shouldDirty: true, shouldValidate: true });
    },
    [form],
  );

  const onSlugBlur = useCallback(() => {
    form.setValue("slug", normalizeStoreSlugInput(form.getValues("slug")), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form]);

  const submit = form.handleSubmit((body) => mutation.mutate(body));

  const useThisStore = useCallback(() => {
    if (!created?.slug) return;
    setStoreSlugOverride(created.slug);
    window.location.href = "/";
  }, [created?.slug]);

  return {
    form,
    created,
    slugPreview,
    isSubmitting: mutation.isPending,
    submit,
    resetAll,
    onDisplayBlur,
    onSlugChange,
    onSlugBlur,
    useThisStore,
  };
};
