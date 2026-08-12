import { useFormContext } from "react-hook-form";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { MercadoPagoCredentialsFormValues, StoreMpPaymentFlags } from "@/schemas/adminMercadoPago";

type MercadoPagoFieldsProps = {
  flags: StoreMpPaymentFlags | undefined;
};

export function MercadoPagoFields({ flags }: MercadoPagoFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<MercadoPagoCredentialsFormValues>();

  const inputClass = `${storefrontInputClass} font-mono text-sm`;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="mpAccessToken" className="mb-1 block text-sm font-medium text-content-muted">
          Access Token (cole apenas para definir ou substituir)
        </label>
        <input
          id="mpAccessToken"
          type="password"
          autoComplete="off"
          placeholder={
            flags?.mpAccessTokenConfigured
              ? "•••••••• (oculto) — cole um novo token para alterar"
              : "APP_USR-…"
          }
          className={inputClass}
          {...register("mpAccessToken")}
        />
        {errors.mpAccessToken ? (
          <p className="mt-1 text-sm text-red-300">{errors.mpAccessToken.message}</p>
        ) : null}
        <p className="mt-1 text-xs text-content-muted">
          Para <strong className="text-content">remover</strong> o token guardado, apague o texto e grave (campo vazio
          = limpar).
        </p>
      </div>
      <div>
        <label htmlFor="mpPublicKey" className="mb-1 block text-sm font-medium text-content-muted">
          Public Key (opcional; mesma regra de ocultação)
        </label>
        <input
          id="mpPublicKey"
          type="password"
          autoComplete="off"
          placeholder={flags?.mpPublicKeyConfigured ? "•••••••• (oculto)" : "APP_USR-… ou TEST-…"}
          className={inputClass}
          {...register("mpPublicKey")}
        />
        {errors.mpPublicKey ? (
          <p className="mt-1 text-sm text-red-300">{errors.mpPublicKey.message}</p>
        ) : null}
      </div>
    </div>
  );
}
