import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { StoreSettings } from "@/contracts/schema";
import {
  adminSettingsFormSchema,
  defaultAdminSettingsFormValues,
  settingsToFormValues,
  type AdminSettingsFormValues,
} from "@/schemas/adminSettingsForm";

const serverSnapshot = (data: StoreSettings): string =>
  JSON.stringify({
    displayName: data.displayName ?? null,
    logoUrl: data.logoUrl ?? null,
    bannerUrl: data.bannerUrl ?? null,
    primaryColor: data.primaryColor ?? null,
    minimumOrderValue: data.minimumOrderValue ?? null,
    publicProfile: data.publicProfile ?? {},
  });

export function useAdminSettingsForm(settingsData: StoreSettings | undefined) {
  const lastSnapshot = useRef("");

  const form = useForm<AdminSettingsFormValues>({
    resolver: zodResolver(adminSettingsFormSchema),
    defaultValues: defaultAdminSettingsFormValues,
    mode: "onBlur",
  });

  useEffect(() => {
    if (!settingsData) return;
    const snap = serverSnapshot(settingsData);
    if (lastSnapshot.current === snap) return;
    lastSnapshot.current = snap;
    form.reset(settingsToFormValues(settingsData));
  }, [settingsData, form]);

  return form;
}
