import { useState, useEffect, useCallback } from "react";
import { adminApiFetch } from "@/react-app/services/api";
import type { AuditLogReport } from "@/shared/types";

const DEBOUNCE_MS = 500;

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLogReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    const params = new URLSearchParams();
    if (searchDebounced) params.set("search", searchDebounced);
    if (actionFilter) params.set("action", actionFilter);
    const qs = params.toString();
    const url = `/api/admin/audit-logs${qs ? `?${qs}` : ""}`;
    try {
      const data = await adminApiFetch<AuditLogReport[]>(url);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar logs";
      setError(msg);
      setForbidden(msg.includes("restrito") || msg.includes("403"));
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, actionFilter]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    forbidden,
    searchInput,
    setSearchInput,
    actionFilter,
    setActionFilter,
    fetchLogs,
  };
};
