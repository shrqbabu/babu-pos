import { useAuth } from '../context/AuthContext';
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore';

import { db } from '../firebase/config';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { useApp, Product, CartItem } from '../context/AppContext';

import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Barcode,
  CreditCard,
  Smartphone,
  Banknote,
  Receipt,
  X,
  User,
  ChevronDown,
  Percent,
  Tag,
  Printer,
  Check,
  Package
} from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatCurrency = (v: number) =>
  `₹${v.toLocaleString('en-IN', {
    minimumFractionDigits: 2
  })}`;

const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random()
    .toString(36)
    .substring(2, 5)
    .toUpperCase();

  return `ORD-${timestamp}${random}`;
};

type PaymentMethod = 'cash' | 'upi' | 'card';

export default function POS() {
  const { currentUser } = useAuth();

  const {
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    updateCartDiscount,
    clearCart,
    cartTotal,
    cartTax,
    cartSubtotal,
    cartDiscount
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cash');

  const [cashReceived, setCashReceived] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  const [showReceiptModal, setShowReceiptModal] =
    useState(false);

  const [lastOrder, setLastOrder] = useState<any>(null);

  const [processing, setProcessing] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const searchRef = useRef<HTMLInputElement>(null);

  // REALTIME PRODUCTS
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        setProducts(data);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to load products');
      }
    );

    return () => unsubscribe();
  }, []);

  // REALTIME CATEGORIES
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setCategories([
          {
            id: 'all',
            name: 'All Items',
            icon: '🏪'
          },
          ...data
        ]);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      p.barcode?.includes(searchQuery);

    const matchesCategory =
      selectedCategory === 'all' ||
      p.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // BARCODE SUPPORT
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeydown = (e: KeyboardEvent) => {
      const now = Date.now();

      if (now - lastKeyTime > 100) {
        barcodeBuffer = '';
      }

      lastKeyTime = now;

      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        const product = products.find(
          (p) => p.barcode === barcodeBuffer
        );

        if (product) {
          handleAddToCart(product);

          toast.success(`${product.name} added`);
        }

        barcodeBuffer = '';
        return;
      }

      if (e.key.length === 1 && /[\d]/.test(e.key)) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () =>
      window.removeEventListener(
        'keydown',
        handleKeydown
      );
  }, [products]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (product.stock <= 0) {
        toast.error('Out of stock');
        return;
      }

      addToCart(product);

      toast.success(`${product.name} added`, {
        duration: 1000
      });
    },
    [addToCart]
  );

  const globalDiscountAmount =
    (cartSubtotal * globalDiscount) / 100;

  const finalTotal =
    cartTotal - globalDiscountAmount;

  const cashChange = cashReceived
    ? parseFloat(cashReceived) - finalTotal
    : 0;

  // PROCESS PAYMENT
  const handleProcessPayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart empty');
      return;
    }

    setProcessing(true);

    try {
      const orderId = generateOrderId();

      const order = {
        orderId,
        items: cart,
        subtotal: cartSubtotal,
        tax: cartTax,
        discount:
          cartDiscount + globalDiscountAmount,
        total: finalTotal,
        paymentMethod,
        cashierName:
          currentUser?.displayName || 'Admin',
        status: 'completed',
        createdAt: new Date()
      };

      // SAVE ORDER
      await addDoc(collection(db, 'orders'), order);

      // UPDATE STOCK
      for (const item of cart) {
        const product = products.find(
          (p) => p.id === item.productId
        );

        if (!product) continue;

        await updateDoc(
          doc(db, 'products', item.productId),
          {
            stock: product.stock - item.quantity
          }
        );
      }

      setLastOrder(order);

      clearCart();

      setCashReceived('');

      setGlobalDiscount(0);

      setShowPaymentModal(false);

      setShowReceiptModal(true);

      toast.success('Payment successful');
    } catch (error) {
      console.error(error);

      toast.error('Payment failed');
    }

    setProcessing(false);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <Layout
      title="POS Billing"
      subtitle="Point of Sale"
    >
      <div className="flex gap-4 h-[calc(100vh-8rem)]">

        {/* PRODUCTS */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* SEARCH */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                ref={searchRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className="w-full border rounded-xl pl-10 pr-4 py-3"
              />
            </div>

            {/* CATEGORY */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategory(cat.id)
                  }
                  className={`px-3 py-2 rounded-xl text-sm ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCTS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-y-auto">

            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() =>
                  handleAddToCart(product)
                }
                className="border rounded-xl p-3 text-left hover:border-indigo-500"
              >
                <div className="aspect-square rounded-xl bg-slate-100 flex items-center justify-center mb-3 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                <p className="font-semibold text-sm truncate">
                  {product.name}
                </p>

                <p className="text-xs text-slate-500">
                  ₹{product.price}
                </p>

                <div className="mt-2">
                  {product.stock <= 0 ? (
                    <Badge variant="danger">
                      Out
                    </Badge>
                  ) : (
                    <Badge variant="success">
                      {product.stock}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
