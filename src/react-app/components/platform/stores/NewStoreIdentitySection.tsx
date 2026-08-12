import { Shield } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { PlatformCreateStoreFormValues } from "@/schemas/platformCreateStore";

type NewStoreIdentitySectionProps = {
  slugPreview: string;
  onDisplayBlur: () => void;
  onSlugChange: (value: string) => void;
  onSlugBlur: () => void;
};

export function NewStoreIdentitySection({
  slugPreview,
  onDisplayBlur,
  onSlugChange,
  onSlugBlur,
}: NewStoreIdentitySectionProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<PlatformCreateStoreFormValues>();
  const slug = watch("slug");
  const displayNameField = register("displayName");

  return (
    <fieldset className="min-w-0 space-y-5 rounded-2xl border border-brand-primary/15 bg-surface-elevated p-5 sm:p-6">
      <legend className="sr-only">Dados da loja</legend>
      <h3 className="border-b border-brand-primary/10 pb-2 font-display text-lg font-semibold text-content">
        Dados da loja
      </h3>
      <p className="text-xs text-content-muted">Nome público, link na plataforma e domínios opcionais.</p>

      <div>
        <label htmlFor="pf-name" className="mb-1 block text-sm font-medium text-content">
          Nome da loja
        </label>
        <input
          id="pf-name"
          {...displayNameField}
          onBlur={(e) => {
            void displayNameField.onBlur(e);
            onDisplayBlur();
          }}
          placeholder="Ex: Barbearia do João"
          className={storefrontInputClass}
        />
        {errors.displayName ? <p className="mt-1 text-xs text-red-400">{errors.displayName.message}</p> : null}
      </div>

      <div>
        <label htmlFor="pf-slug" className="mb-1 block text-sm font-medium text-content">
          Link da loja (URL)
        </label>
        <input
          id="pf-slug"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          onBlur={onSlugBlur}
          placeholder="barbearia-do-joao"
          className={`${storefrontInputClass} font-mono`}
        />
        {errors.slug ? <p className="mt-1 text-xs text-red-400">{errors.slug.message}</p> : null}
        <p className="mt-1 text-xs text-content-muted">
          Só letras minúsculas, números e hífens. Pré-visualização:{" "}
          <span className="font-mono text-content">{slugPreview || "—"}</span>
        </p>
      </div>

      <div>
        <label htmlFor="pf-domains" className="mb-1 flex items-center gap-2 text-sm font-medium text-content">
          <Shield className="h-4 w-4 text-content-muted" aria-hidden />
          Domínios customizados (opcional)
        </label>
        <input
          id="pf-domains"
          {...register("customDomainInput")}
          placeholder="lojaexemplo.com.br, www.lojaexemplo.com.br"
          className={storefrontInputClass}
        />
        <p className="mt-1 text-xs text-content-muted">Vários domínios separados por vírgula.</p>
      </div>
    </fieldset>
  );
}
