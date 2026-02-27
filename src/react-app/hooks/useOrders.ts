import { useState, useEffect } from 'react';
import { apiFetch } from '@/react-app/lib/api';
import { Order } from '@/react-app/types';

export function useOrders(userAuthLoaded: boolean) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiFetch('/api/orders');
            setOrders(data);
        } catch (err: any) {
            console.error('Erro ao buscar pedidos:', err);
            setError(err.message || 'Erro ao carregar os pedidos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userAuthLoaded) {
            fetchOrders();
        }
    }, [userAuthLoaded]);

    return { orders, loading, error, refreshOrders: fetchOrders };
}
