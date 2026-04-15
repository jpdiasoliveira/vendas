import { ProductCard } from "./ProductCard";
import type { Product } from "@/react-app/types";
import { Loader2, Package } from "lucide-react";
import { useNavigate } from "react-router";
import { storefrontShellClass } from "@/react-app/utils/storefrontLayout";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  /** IDs dos produtos no top de vendas (view_top_sellers). Se vazio, nenhum badge MAIS VENDIDO. */
  trendingProductIds?: string[];
}

export function ProductGrid({ products, loading, error, trendingProductIds = [] }: ProductGridProps) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 text-[#1B4332] animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/50 shadow-xl text-center">
                <p className="text-red-500 text-lg mb-4">{error}</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/50 shadow-xl text-center">
                <Package className="h-16 w-16 text-[#6D4C41]/30 mx-auto mb-4" />
                <p className="text-[#6D4C41] text-lg mb-4">Nenhum produto disponível no momento.</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-8 py-3 rounded-full font-bold hover:shadow-xl transition-all duration-300"
                >
                    Voltar a Home
                </button>
            </div>
        );
    }

    return (
        <section id="produtos" className={`relative py-16 sm:py-24 ${storefrontShellClass}`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FFD166]/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#1B4332]/10 to-transparent rounded-full blur-3xl"></div>

            <div className="text-center mb-16 relative z-10">
                <div className="inline-block bg-white/60 backdrop-blur-sm px-6 py-2 rounded-full mb-4 border border-[#1B4332]/10">
                    <span className="text-sm font-medium text-[#1B4332] font-inter">Explore Nossa Linha</span>
                </div>
                <h3 className="text-3xl sm:text-4xl md:text-6xl font-bold text-[#1B4332] mb-4 font-playfair px-1">
                    Nossos Produtos
                </h3>
                <p className="text-base sm:text-lg text-[#5a4035] max-w-2xl mx-auto font-inter px-2">
                    Selecione os melhores chips de banana, crocantes e naturais
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        isFeatured={trendingProductIds.includes(product.id)}
                    />
                ))}
            </div>
        </section>
    );
}
