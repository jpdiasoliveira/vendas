import { QueryClient } from "@tanstack/react-query";

/** staleTime padrão 2 min — evita refetch agressivo em navegação e foco da janela. */
export const DEFAULT_STALE_TIME_MS = 120_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      refetchOnWindowFocus: false,
      /** Evita rajadas de pedidos quando o Worker/DB devolve erro. */
      retry: false,
    },
  },
});
