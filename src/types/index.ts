export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
  stock: number;
  barcode?: string;
  description?: string;
  cost?: number;
}

export interface CartItem extends Product {
  quantity: number;
  discount?: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  cashReceived?: number;
  change?: number;
  status: 'completed' | 'refunded' | 'pending';
  createdAt: string;
  cashier: string;
  orderNumber: number;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export type PaymentMethod = 'cash' | 'card' | 'digital';
export type ViewType = 'pos' | 'orders' | 'products' | 'analytics' | 'settings';
