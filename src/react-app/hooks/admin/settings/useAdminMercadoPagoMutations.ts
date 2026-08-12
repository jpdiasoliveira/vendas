import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApiFetch } from "@/react-app/services/api";
import { adminStorePaymentsQueryKey } from "@/react-app/query/queryKeys";
import { useToast } from "@/react-app/providers/ToastProvider";
import type {
  MercadoPagoPatchInput,
  MercadoPagoTestInput,
  MercadoPagoTestResult,
  StoreMpPaymentFlags,
} from "@/schemas/adminMercadoPago";

export function useAdminMercadoPagoMutations(storeSlug: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const payKey = adminStorePaymentsQueryKey(storeSlug);

  const saveMutation = useMutation({
    mutationFn: async (body: MercadoPagoPatchInput) =>
      adminApiFetch<StoreMpPaymentFlags>("/api/admin/store/payments", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: payKey });
      const previous = queryClient.getQueryData<StoreMpPaymentFlags>(payKey);
      if (previous) {
        const next: StoreMpPaymentFlags = { ...previous };
        if (body.mpAccessToken !== undefined) {
          next.mpAccessTokenConfigured =
            body.mpAccessToken !== null && body.mpAccessToken.trim().length > 0;
        }
        if (body.mpPublicKey !== undefined) {
          next.mpPublicKeyConfigured = body.mpPublicKey !== null && body.mpPublicKey.trim().length > 0;
        }
        queryClient.setQueryData(payKey, next);
      }
      return { previous };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(payKey, data);
      showToast({
        type: "success",
        message: "Credenciais guardadas de forma cifrada. Os campos foram limpos por segurança.",
      });
    },
    onError: (err: unknown, _body, context) => {
      if (context?.previous) queryClient.setQueryData(payKey, context.previous);
      showToast({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao gravar credenciais.",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (body: MercadoPagoTestInput) =>
      adminApiFetch<MercadoPagoTestResult>("/api/admin/store/payments/test", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      showToast({
        type: "success",
        message: `Conexão OK com o Mercado Pago (conta ${String(data.mpUserId)}${data.nickname ? ` — ${data.nickname}` : ""}).`,
      });
    },
    onError: (err: unknown) => {
      showToast({
        type: "error",
        message: err instanceof Error ? err.message : "Falha ao testar conexão.",
      });
    },
  });

  return { saveMutation, testMutation };
}
