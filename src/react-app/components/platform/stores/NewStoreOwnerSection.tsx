import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { PlatformCreateStoreFormValues } from "@/schemas/platformCreateStore";

export function NewStoreOwnerSection() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<PlatformCreateStoreFormValues>();
  const [showPassword, setShowPassword] = useState(false);
  const sendPasswordSetupLink = watch("sendPasswordSetupLink");

  return (
    <fieldset className="min-w-0 space-y-5 rounded-2xl border border-brand-primary/15 bg-surface-muted/30 p-5 sm:p-6">
      <legend className="sr-only">Dados do dono</legend>
      <h3 className="border-b border-brand-primary/10 pb-2 font-display text-lg font-semibold text-content">
        Dados do dono
      </h3>

      <div>
        <p className="text-sm font-semibold text-content">Administrador</p>
        <p className="mt-0.5 text-xs text-content-muted">O e-mail será o login principal desta loja.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-owner-name" className="mb-1 block text-sm font-medium text-content">
              Nome
            </label>
            <input
              id="pf-owner-name"
              {...register("ownerAdminName")}
              placeholder="Ex: João Silva"
              autoComplete="name"
              className={storefrontInputClass}
            />
            {errors.ownerAdminName ? (
              <p className="mt-1 text-xs text-red-400">{errors.ownerAdminName.message}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="pf-owner-email" className="mb-1 block text-sm font-medium text-content">
              E-mail
            </label>
            <input
              id="pf-owner-email"
              type="email"
              {...register("ownerAdminEmail")}
              placeholder="admin@loja.com"
              autoComplete="email"
              className={storefrontInputClass}
            />
            {errors.ownerAdminEmail ? (
              <p className="mt-1 text-xs text-red-400">{errors.ownerAdminEmail.message}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-content">Acesso</p>
        <p className="mt-0.5 text-xs text-content-muted">Senha agora ou convite por e-mail.</p>
        <div className="mt-3 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-primary/15 bg-surface-elevated px-3 py-2.5">
            <input
              type="checkbox"
              checked={sendPasswordSetupLink}
              onChange={(e) => {
                setValue("sendPasswordSetupLink", e.target.checked, { shouldDirty: true, shouldValidate: true });
                if (e.target.checked) setValue("initialPassword", "", { shouldDirty: true, shouldValidate: true });
              }}
              className="mt-0.5 h-4 w-4 rounded border-brand-primary/30 accent-brand-primary"
            />
            <span>
              <span className="block text-sm font-medium text-content">Enviar link para definir senha</span>
              <span className="mt-0.5 block text-xs text-content-muted">Requer e-mail configurado no Supabase.</span>
            </span>
          </label>
          <div>
            <label htmlFor="pf-password" className="mb-1 block text-sm font-medium text-content">
              Senha inicial
            </label>
            <div className="relative">
              <input
                id="pf-password"
                type={showPassword ? "text" : "password"}
                {...register("initialPassword")}
                disabled={sendPasswordSetupLink}
                autoComplete="new-password"
                placeholder={sendPasswordSetupLink ? "Desativado" : "Mínimo 8 caracteres"}
                className={`${storefrontInputClass} pr-11 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              <button
                type="button"
                tabIndex={-1}
                disabled={sendPasswordSetupLink}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-content-muted transition hover:bg-surface-muted hover:text-content disabled:opacity-40"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            {errors.initialPassword ? (
              <p className="mt-1 text-xs text-red-400">{errors.initialPassword.message}</p>
            ) : null}
          </div>
        </div>
      </div>
    </fieldset>
  );
}
