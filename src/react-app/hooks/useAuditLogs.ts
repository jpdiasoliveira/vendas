import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import { adminAuditLogsQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";
import type { AuditLogReport } from "@/shared/types";
import {
  AUDIT_ACTION_KEYS_CREATE,
  AUDIT_ACTION_KEYS_DELETE,
  AUDIT_FILTER_QUICK_CREATE,
  AUDIT_FILTER_QUICK_DELETE,
} from "@/react-app/utils/auditLogDisplay";

const DEBOUNCE_MS = 500;

const buildAuditLogsUrl = (search: string, actionFilter: string) => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (actionFilter === AUDIT_FILTER_QUICK_CREATE) {
    params.set("actions", [...AUDIT_ACTION_KEYS_CREATE].join(","));
  } else if (actionFilter === AUDIT_FILTER_QUICK_DELETE) {
    params.set("actions", [...AUDIT_ACTION_KEYS_DELETE].join(","));
  } else if (actionFilter) {
    params.set("action", actionFilter);
  }
  const qs = params.toString();
  return `/api/admin/audit-logs${qs ? `?${qs}` : ""}`;
};

const fetchAuditLogs = async (search: string, actionFilter: string) => {
  const data = await adminApiFetch<AuditLogReport[]>(buildAuditLogsUrl(search, actionFilter));
  return Array.isArray(data) ? data : [];
};

const isForbiddenMessage = (message: string) => message.includes("restrito") || message.includes("403");

export const useAuditLogs = () => {
  const { user } = useAuth();
  const slug = getEffectiveStoreSlug();
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useQuery({
    queryKey: adminAuditLogsQueryKey(slug || "_", searchDebounced, actionFilter),
    queryFn: () => fetchAuditLogs(searchDebounced, actionFilter),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });

  const errorMessage =
    query.isError && query.error instanceof Error
      ? query.error.message
      : query.isError
        ? String(query.error)
        : null;
  const forbidden = !!errorMessage && isForbiddenMessage(errorMessage);

  return {
    logs: query.data ?? [],
    loading: query.isPending && query.data === undefined,
    refetching: query.isFetching && query.data !== undefined,
    error: forbidden ? null : errorMessage,
    forbidden,
    searchInput,
    setSearchInput,
    actionFilter,
    setActionFilter,
    refetch: query.refetch,
  };
};
