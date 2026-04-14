import { useState, useEffect } from "react";
import { apiFetch } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";

// [MOCK LOCAL]: Produtos de teste para exibição quando o banco estiver vazio
const MOCK_PRODUCTS: Product[] = [
  {
    id: "mock-1",
    storeId: "local-store",
    name: "Chips de Banana Salgada 50g",
    description: "Clássicos, crocantes e salgadinhos na medida certa.",
    price: 8.90,
    imageUrl: "https://019bbfb8-9605-7525-9961-da2eb272419f.mochausercontent.com/product-1.png",
    stock: 100,
    status: "active"
  },
  {
    id: "mock-2",
    storeId: "local-store",
    name: "Chips de Banana Doce 50g",
    description: "Com um toque de canela, ideal para o lanche da tarde.",
    price: 8.90,
    imageUrl: "https://019bbfb8-9605-7525-9961-da2eb272419f.mochausercontent.com/product-2.png",
    stock: 50,
    status: "active"
  },
  {
    id: "mock-3",
    storeId: "local-store",
    name: "Chips de Banana Picante 50g",
    description: "Para quem gosta de uma leve picância.",
    price: 9.90,
    imageUrl: "https://019bbfb8-9605-7525-9961-da2eb272419f.mochausercontent.com/product-3.png",
    stock: 30,
    status: "active"
  }
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Carrega a lista de produtos da loja ao montar. */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Product[]>("/api/products");
        
        // Se o banco estiver vazio, usa os produtos MOCK para manter a interface visual
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          console.warn("📦 [LocalDB] Nenhum produto no banco. Usando dados Mock para teste visual.");
          setProducts(MOCK_PRODUCTS);
        }
        
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao carregar os produtos";
        console.error("[useProducts.fetchProducts] Falha ao carregar produtos:", err);
        // Em caso de erro, também mostra o MOCK para não quebrar a UI durante os testes
        setProducts(MOCK_PRODUCTS);
        setError(null); // Oculta o erro para focar no design
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}
