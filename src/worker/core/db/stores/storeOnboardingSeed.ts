/**
 * **Seed de catálogo** na criação de uma loja nova (categorias + produtos de exemplo).
 *
 * Por que ficheiro isolado?
 * - Não é “repositório de loja” no sentido REST: é conteúdo de demonstração e pode mudar sem tocar em leituras de tenant.
 * - Facilita desligar ou substituir o seed por templates por nicho (ex.: só lojas alimentares) sem reler `createStoreWithOwner`.
 */

import { getSupabase } from "../../supabase.js";

type SeedCategoryInput = {
  name: string;
  sortOrder: number;
};

type SeedProductInput = {
  categoryName: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: "active" | "inactive";
};

/**
 * Para que serve: transformar nome legível em **slug URL-safe** com sufixo aleatório curto.
 * O sufixo `Date.now` + random evita colisão se o operador criar duas lojas no mesmo segundo em dev.
 */
function slugFromLabel(raw: string, fallback: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || fallback;
}

const DEFAULT_ONBOARDING_CATEGORIES: SeedCategoryInput[] = [
  { name: "Destaques", sortOrder: 1 },
  { name: "Mais vendidos", sortOrder: 2 },
  { name: "Novidades", sortOrder: 3 },
];

const DEFAULT_ONBOARDING_PRODUCTS: SeedProductInput[] = [
  {
    categoryName: "Destaques",
    name: "Produto principal",
    description: "Item inicial para editar preço, foto e descrição da sua loja.",
    price: 19.9,
    stock: 25,
    status: "active",
  },
  {
    categoryName: "Mais vendidos",
    name: "Produto premium",
    description: "Exemplo de item premium para montar kits e promoções.",
    price: 29.9,
    stock: 20,
    status: "active",
  },
  {
    categoryName: "Novidades",
    name: "Produto lançamento",
    description: "Use este item para divulgar novidades com destaque na vitrine.",
    price: 24.9,
    stock: 15,
    status: "active",
  },
];

/**
 * Para que serve: após criar `stores` + `store_settings`, preencher **categorias e produtos** mínimos para o admin não ver vitrine vazia.
 * A linha `byName.set`: mapa nome→UUID porque `products.category_id` precisa do id gerado pelo insert em `categories`.
 */
export async function seedDefaultCatalog(env: Env, storeId: string): Promise<void> {
  const supabase = getSupabase(env);
  const now = new Date().toISOString();

  const categoryRows = DEFAULT_ONBOARDING_CATEGORIES.map((cat) => ({
    store_id: storeId,
    name: cat.name,
    slug: `${slugFromLabel(cat.name, "categoria")}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    sort_order: cat.sortOrder,
    created_at: now,
    updated_at: now,
  }));

  const { data: insertedCategories, error: categoryErr } = await supabase
    .from("categories")
    .insert(categoryRows)
    .select("id, name");
  if (categoryErr) throw new Error(categoryErr.message);

  const byName = new Map<string, string>();
  for (const c of insertedCategories ?? []) {
    byName.set(String(c.name), String(c.id));
  }

  const productRows = DEFAULT_ONBOARDING_PRODUCTS.map((p) => ({
    store_id: storeId,
    category_id: byName.get(p.categoryName) ?? null,
    name: p.name,
    slug: `${slugFromLabel(p.name, "produto")}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    description: p.description,
    price: p.price,
    stock: p.stock,
    status: p.status,
    image_url: null,
    metadata: { seeded: true },
    created_at: now,
    updated_at: now,
  }));

  const { error: productErr } = await supabase.from("products").insert(productRows);
  if (productErr) throw new Error(productErr.message);
}
