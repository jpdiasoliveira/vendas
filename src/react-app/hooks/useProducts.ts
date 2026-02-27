import { useState, useEffect } from 'react';
import { apiFetch } from '@/react-app/lib/api';

export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    category?: string;
    stock?: number;
}

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                // apiFetch already handles x-store-slug header
                const data = await apiFetch('/api/products');
                setProducts(data);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching products:', err);
                setError(err.message || 'Erro ao carregar os produtos');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return { products, loading, error };
}
