// POS Cart Context for SmartPOS
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  barcode?: string;
  category?: string;
}

export interface POSContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  discount: number;
  setDiscount: (d: number) => void;
  taxRate: number;
  setTaxRate: (t: number) => void;
  paymentMethod: string;
  setPaymentMethod: (m: string) => void;
  selectedCustomer: any;
  setSelectedCustomer: (c: any) => void;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

const POSContext = createContext<POSContextType>({} as POSContextType);
export const usePOS = () => useContext(POSContext);

export const POSProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(18); // 18% GST default
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(c => c.productId === item.productId);
      if (existing) {
        return prev.map(c =>
          c.productId === item.productId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(c => c.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(c => c.productId !== productId));
    } else {
      setCart(prev =>
        prev.map(c => (c.productId === productId ? { ...c, quantity } : c))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setPaymentMethod('cash');
  }, []);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <POSContext.Provider
      value={{
        cart, addToCart, removeFromCart, updateQuantity, clearCart,
        discount, setDiscount, taxRate, setTaxRate,
        paymentMethod, setPaymentMethod,
        selectedCustomer, setSelectedCustomer,
        subtotal, discountAmount, taxAmount, total, itemCount,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};
