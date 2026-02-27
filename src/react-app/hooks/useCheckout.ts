import { useState } from 'react';
import { apiFetch } from '@/react-app/lib/api';
import { Order } from '@/react-app/types';

export function useCheckout() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createOrder = async (items: any[]) => {
        setIsProcessing(true);
        setError(null);
        try {
            const data = await apiFetch('/api/orders', {
                method: 'POST',
                body: JSON.stringify({ items }),
            });
            return data;
        } catch (err: any) {
            console.error('Error creating order:', err);
            setError(err.message || 'Erro ao processar pedido. Tente novamente.');
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const processPayment = async (orderId: number, paymentMethod: string) => {
        setIsProcessing(true);
        setError(null);
        try {
            const data = await apiFetch(`/api/orders/${orderId}/payment`, {
                method: 'POST',
                body: JSON.stringify({ payment_method: paymentMethod }),
            });
            return data;
        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message || 'Erro ao processar pagamento. Tente novamente.');
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const checkPaymentStatus = async (orderId: number) => {
        setIsProcessing(true);
        setError(null);
        try {
            const order = await apiFetch(`/api/orders/${orderId}`);
            return order as Order;
        } catch (err: any) {
            console.error('Error checking status:', err);
            setError(err.message || 'Erro ao verificar os status. Tente novamente.');
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        createOrder,
        processPayment,
        checkPaymentStatus,
        isProcessing,
        error
    };
}
