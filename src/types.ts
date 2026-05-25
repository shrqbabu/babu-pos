// Shared TypeScript types for SmartPOS

export type Role = "admin" | "cashier";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  active?: boolean;
  createdAt?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
  barcode?: string;
  image?: string;
  lowStockAt?: number;
  status?: "in_stock" | "out_of_stock";
  createdAt?: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  stock: number;
}

export type PaymentMethod = "cash" | "upi" | "card";

export interface Order {
  id: string;
  orderNo: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment: PaymentMethod;
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  totalSpent: number;
  visits: number;
  createdAt?: number;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface PurchaseEntry {
  id: string;
  productId: string;
  productName: string;
  supplierId?: string;
  supplierName?: string;
  qty: number;
  cost: number;
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  meta?: string;
  createdAt: number;
}
