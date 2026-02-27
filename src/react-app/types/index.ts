export interface Store {
    id: string;
    slug: string;
    display_name: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    category?: string;
    stock?: number;
}

export interface OrderItem {
    id?: number;
    order_id?: number;
    product_id: string;
    quantity: number;
    price: number;
    name?: string;
    image?: string;
}

export interface Order {
    id: number;
    status: string;
    total: number;
    payment_method: string | null;
    payment_status: string | null;
    created_at: string;
    items?: OrderItem[];
}
