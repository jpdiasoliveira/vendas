import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminMeQueryKey } from "@/react-app/query/queryKeys";
import { DEFAULT_STALE_TIME_MS } from "@/react-app/query/queryClient";
import { adminApiFetch } from "@/react-app/services/api";

export type AdminMeResponse = { id: string; role: string };

export const useAdminMeQuery = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: adminMeQueryKey,
    queryFn: () => adminApiFetch<AdminMeResponse>("/api/admin/me"),
    staleTime: DEFAULT_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!user,
  });
};
