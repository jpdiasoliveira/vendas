import { useFormContext } from "react-hook-form";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import { clampStoreLogoHeightPx } from "@/react-app/utils/storeLogoDisplay";
import { useSettingsPreviewFieldProps } from "@/react-app/components/admin/settings/fields/useSettingsPreviewFieldProps";

export function SettingsLogoOptionsFields() {
  const { register, watch, setValue } = useFormContext<AdminSettingsFormValues>();
  const preview = useSettingsPreviewFieldProps("navbar");
  const height = clampStoreLogoHeightPx(watch("publicProfile.logoHeightPx") ?? undefined);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor="logoHeightPx">
          Altura do logo (px)
        </label>
        <input
          id="logoHeightPx"
          type="number"
          min={20}
          max={100}
          value={height}
          onChange={(e) => {
            const raw = Number.parseInt(e.target.value, 10);
            setValue("publicProfile.logoHeightPx", clampStoreLogoHeightPx(Number.isFinite(raw) ? raw : undefined), {
              shouldDirty: true,
            });
          }}
          className={storefrontInputClass}
          {...preview}
        />
        <p className="mt-1 text-xs text-content-muted">Entre 20 e 100 px.</p>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-primary/10 bg-surface-muted/40 p-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-brand-primary/30"
          {...register("publicProfile.logoKnockoutWhite")}
          {...preview}
        />
        <span>
          <span className="block text-sm font-medium text-content">Remover fundo branco</span>
          <span className="mt-0.5 block text-xs text-content-muted">
            Aplica mix-blend-mode: multiply no logo para atenuar fundos brancos opacos.
          </span>
        </span>
      </label>
    </div>
  );
}
