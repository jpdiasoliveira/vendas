import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  platformGraceSettingsFormSchema,
  type PlatformGraceSettingsFormValues,
} from "@/schemas/platformRuntimeSettings";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

type PlatformGraceSettingsFormProps = {
  defaultGraceDays?: number;
  isSaving: boolean;
  onSubmit: (values: PlatformGraceSettingsFormValues) => void;
};

export function PlatformGraceSettingsForm({
  defaultGraceDays,
  isSaving,
  onSubmit,
}: PlatformGraceSettingsFormProps) {
  const form = useForm<PlatformGraceSettingsFormValues>({
    resolver: zodResolver(platformGraceSettingsFormSchema),
    defaultValues: { subscriptionGraceDays: defaultGraceDays ?? 7 },
    mode: "onBlur",
  });

  useEffect(() => {
    if (defaultGraceDays === undefined) return;
    form.reset({ subscriptionGraceDays: defaultGraceDays });
  }, [defaultGraceDays, form]);

  const dirty = form.formState.isDirty;

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={form.handleSubmit((values) => onSubmit(values))}
      noValidate
    >
      <div>
        <label htmlFor="grace-days-field" className="mb-1 block text-xs font-medium text-content">
          Dias (0 a 90)
        </label>
        <input
          id="grace-days-field"
          type="number"
          min={0}
          max={90}
          step={1}
          {...form.register("subscriptionGraceDays", { valueAsNumber: true })}
          className={`${storefrontInputClass} w-28 py-2 font-mono`}
        />
        {form.formState.errors.subscriptionGraceDays ? (
          <p className="mt-1 text-xs text-red-400">{form.formState.errors.subscriptionGraceDays.message}</p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={!dirty || isSaving}
        className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
      >
        {isSaving ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            A gravar…
          </span>
        ) : (
          "Salvar"
        )}
      </button>
    </form>
  );
}
