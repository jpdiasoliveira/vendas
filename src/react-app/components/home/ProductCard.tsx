import { useCart } from '@/react-app/contexts/CartContext';
import { Product } from '@/react-app/hooks/useProducts';

interface ProductCardProps {
    product: Product;
    isFeatured?: boolean;
}

export function ProductCard({ product, isFeatured = false }: ProductCardProps) {
    const { addItem } = useCart();

    const handleAdd = () => {
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url || 'https://via.placeholder.com/300'
        });
    };

    return (
        <div className={`group relative ${isFeatured ? 'md:-mt-4' : ''}`}>
            <div className={`absolute inset-0 bg-gradient-to-br from-[#FFD166]/${isFeatured ? '30' : '20'} to-[#1B4332]/${isFeatured ? '30' : '20'} rounded-3xl blur-${isFeatured ? '2xl' : 'xl'} group-hover:blur-${isFeatured ? '3xl' : '2xl'} transition-all duration-500 opacity-${isFeatured ? '100' : '0'} group-hover:opacity-100`}></div>
            <div className={`relative bg-white/${isFeatured ? '90' : '80'} backdrop-blur-xl rounded-3xl shadow-${isFeatured ? '2xl' : 'xl'} hover:shadow-2xl transition-all duration-500 overflow-hidden border border-${isFeatured ? '[#FFD166]/30' : 'white/50'} hover:-translate-y-${isFeatured ? '3' : '2'} hover:border-[#FFD166]/${isFeatured ? '50' : '30'}`}>
                {isFeatured && (
                    <div className="absolute top-4 right-4 z-20">
                        <div className="bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-4 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                            MAIS VENDIDO
                        </div>
                    </div>
                )}
                <div className={`relative overflow-hidden bg-gradient-to-br from-[#FAF8F3] via-white to-[#FFD166]/${isFeatured ? '10' : '5'} p-8`}>
                    <div className={`absolute top-0 right-0 w-${isFeatured ? '40' : '32'} h-${isFeatured ? '40' : '32'} bg-[#FFD166]/${isFeatured ? '20' : '10'} rounded-full blur-${isFeatured ? '3xl' : '2xl'}`}></div>
                    <img
                        src={product.image_url || 'https://via.placeholder.com/300'}
                        alt={product.name}
                        className="w-full h-80 object-contain group-hover:scale-110 transition-transform duration-700 relative z-10"
                    />
                </div>
                <div className={`p-6 bg-gradient-to-b from-white/${isFeatured ? '60' : '50'} to-white/${isFeatured ? '90' : '80'} backdrop-blur-sm`}>
                    <h4 className="text-2xl font-bold text-[#1B4332] mb-2 font-playfair">{product.name}</h4>
                    <p className="text-[#6D4C41] mb-4 font-inter text-sm line-clamp-2">{product.description || 'Pura banana orgânica, crocante e naturalmente doce'}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold bg-gradient-to-r from-[#1B4332] to-[#6D4C41] bg-clip-text text-transparent font-playfair">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                        </span>
                        <button
                            onClick={handleAdd}
                            className="bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-[#1B4332]/30 transition-all duration-300 hover:scale-105 font-inter font-medium"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
