import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { adminApiFetch } from "@/react-app/services/api";
import type { Category } from "@/react-app/types";
import { Loader2, Plus, Trash2, Pencil, FolderTree } from "lucide-react";

const AdminCategoriesPage = () => {
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOrder, setNewOrder] = useState("0");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState("0");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiFetch<Category[]>("/api/admin/categories");
      setList(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      await load();
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
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir a categoria «${name}»? Produtos vinculados ficarão sem categoria.`)) return;
    setError(null);
    try {
      await adminApiFetch(`/api/admin/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-4 pb-12 pt-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <AdminNav />
        <div className="mt-6 rounded-3xl border border-[#1B4332]/10 bg-white/90 p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <FolderTree className="h-8 w-8 text-[#1B4332]" aria-hidden />
            <div>
              <h1 className="font-playfair text-2xl font-bold text-[#1B4332]">Categorias</h1>
              <p className="text-sm text-[#6D4C41]">Crie e organize as categorias dos produtos desta loja.</p>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
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
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
    </div>
  );
};

export default AdminCategoriesPage;
