import { useState, useCallback, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { adminApiFetch } from "@/react-app/services/api";
import type { Category } from "@/react-app/types";
import { Loader2, Plus, Trash2, Pencil, RefreshCw } from "lucide-react";
import { useAdminCategoriesQuery } from "@/react-app/hooks/useAdminCategoriesQuery";
import type { AdminCatalogHubOutletContext } from "@/react-app/components/admin/adminCatalogHubOutletContext";

const AdminCategoriesPage = () => {
  const { setCatalogHubToolbar } = useOutletContext<AdminCatalogHubOutletContext>();
  const queryClient = useQueryClient();
  const categoriesQuery = useAdminCategoriesQuery();
  const list = categoriesQuery.data ?? [];
  const loading = categoriesQuery.isPending && categoriesQuery.data === undefined;
  const loadError =
    categoriesQuery.isError
      ? categoriesQuery.error instanceof Error
        ? categoriesQuery.error.message
        : String(categoriesQuery.error)
      : null;
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOrder, setNewOrder] = useState("0");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState("0");

  const invalidateCategories = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
  }, [queryClient]);

  const combinedError = error ?? loadError;

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      await adminApiFetch("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name,
          sort_order: Number.parseInt(newOrder, 10) || 0,
        }),
      });
      setNewName("");
      setNewOrder("0");
      invalidateCategories();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditOrder(String(c.sortOrder ?? 0));
  };

  const saveEdit = async (id: string) => {
    setError(null);
    try {
      await adminApiFetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          sort_order: Number.parseInt(editOrder, 10) || 0,
        }),
      });
      setEditingId(null);
      invalidateCategories();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir a categoria «${name}»? Produtos vinculados ficarão sem categoria.`)) return;
    setError(null);
    try {
      await adminApiFetch(`/api/admin/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
      invalidateCategories();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  const refetching = categoriesQuery.isFetching && categoriesQuery.data !== undefined;
  const categoriesInitialLoading = categoriesQuery.isPending && categoriesQuery.data === undefined;

  useEffect(() => {
    setCatalogHubToolbar(
      <button
        type="button"
        onClick={() => void categoriesQuery.refetch()}
        disabled={categoriesInitialLoading}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[color:var(--brand-primary)]/25 bg-white/90 px-3 py-2 text-sm font-medium text-[#6D4C41] shadow-sm transition-all hover:border-[color:var(--brand-primary)]/35 hover:bg-white hover:text-[var(--brand-primary)] disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 shrink-0 ${refetching ? "animate-spin" : ""}`} />
        Atualizar
      </button>
    );
    return () => setCatalogHubToolbar(null);
  }, [categoriesInitialLoading, categoriesQuery.refetch, refetching, setCatalogHubToolbar]);

  return (
    <>
      <div className="w-full min-w-0">
        <div className="rounded-3xl border border-[#1B4332]/10 bg-white/90 p-5 shadow-sm sm:p-8">
          {combinedError ? (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{combinedError}</div>
          ) : null}

          <section className="mb-8 rounded-2xl border border-[#1B4332]/10 bg-[#FAF8F3]/50 p-4">
            <h2 className="mb-3 text-sm font-semibold text-[#1B4332]">Nova categoria</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-xs text-[#6D4C41]">Nome</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-[#1B4332]/20 px-3 py-2.5 text-sm"
                  placeholder="Ex.: Snacks da Amazônia"
                />
              </div>
              <div className="w-full sm:w-24">
                <label className="mb-1 block text-xs text-[#6D4C41]">Ordem</label>
                <input
                  type="number"
                  value={newOrder}
                  onChange={(e) => setNewOrder(e.target.value)}
                  className="w-full rounded-xl border border-[#1B4332]/20 px-3 py-2.5 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating || !newName.trim()}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-5 py-3 text-sm font-semibold text-white shadow-md transition-[box-shadow,transform] hover:shadow-lg hover:brightness-105 active:scale-[0.99] disabled:opacity-50 sm:text-base"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar
              </button>
            </div>
          </section>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-[#1B4332]" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6D4C41]">Nenhuma categoria ainda.</p>
          ) : (
            <ul className="divide-y divide-[#1B4332]/10 rounded-2xl border border-[#1B4332]/10">
              {list.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  {editingId === c.id ? (
                    <>
                      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-xl border border-[#1B4332]/20 px-3 py-2 text-sm sm:max-w-xs"
                        />
                        <input
                          type="number"
                          value={editOrder}
                          onChange={(e) => setEditOrder(e.target.value)}
                          className="w-24 rounded-xl border border-[#1B4332]/20 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void saveEdit(c.id)}
                          className="rounded-xl bg-[#1B4332] px-3 py-2 text-sm font-medium text-white"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-xl border border-[#1B4332]/20 px-3 py-2 text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="font-medium text-[#1B4332]">{c.name}</p>
                        <p className="font-mono text-xs text-[#6D4C41]">
                          ordem {c.sortOrder ?? 0}
                          {c.slug ? ` · ${c.slug}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#1B4332]/20 px-3 py-2 text-sm text-[#1B4332]"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(c.id, c.name)}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-800"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminCategoriesPage;
