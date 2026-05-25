import { useAuth } from '../context/AuthContext';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { useApp, Product, CartItem } from '../context/AppContext';
import { DEMO_PRODUCTS, DEMO_CATEGORIES, DEMO_CUSTOMERS, DEMO_SETTINGS } from '../data/demoData';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Barcode,
  CreditCard, Smartphone, Banknote, Receipt, X, User,
  ChevronDown, Percent, Tag, Printer, Check, Package
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}${random}`;
};

type PaymentMethod = 'cash' | 'upi' | 'card';

export default function POS() {
  const { currentUser } = useAuth();
  const { cart, addToCart, removeFromCart, updateCartQty, updateCartDiscount, clearCart,
    cartTotal, cartTax, cartSubtotal, cartDiscount } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        if (!snapshot.empty) {
          const firebaseProducts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
          setProducts(firebaseProducts);
        } else {
          setProducts(DEMO_PRODUCTS);
        }
      } catch (error) {
        console.error(error);
        setProducts(DEMO_PRODUCTS);
      }
    };
    fetchProducts();
  }, []);

  const categories = [{ id: 'all', name: 'All Items', icon: '🏪' }, ...DEMO_CATEGORIES];

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && p.status === 'active';
  });

  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeydown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastKeyTime > 100) barcodeBuffer = '';
      lastKeyTime = now;

      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        const product = products.find(p => p.barcode === barcodeBuffer);
        if (product) {
          handleAddToCart(product as Product);
          barcodeBuffer = '';
          toast.success(`${product.name} added via barcode`);
        }
        barcodeBuffer = '';
        return;
      }

      if (e.key.length === 1 && /[\d]/.test(e.key)) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [products]);

  const handleAddToCart = useCallback((product: Product) => {
    if (product.stock === 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    addToCart(product);
    toast.success(`${product.name} added`, { duration: 1000 });
  }, [addToCart]);

  const filteredCustomers = DEMO_CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const globalDiscountAmount = (cartSubtotal * globalDiscount) / 100;
  const finalTotal = cartTotal - globalDiscountAmount;
  const cashChange = cashReceived ? parseFloat(cashReceived) - finalTotal : 0;

  const handleProcessPayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setProcessing(true);

    try {
      const orderId = generateOrderId();
      const order = {
        id: orderId,
        orderId,
        items: cart,
        subtotal: cartSubtotal,
        tax: cartTax,
        discount: cartDiscount + globalDiscountAmount,
        globalDiscount,
        total: finalTotal,
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : finalTotal,
        cashChange: paymentMethod === 'cash' ? cashChange : 0,
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || null,
        cashierName: currentUser?.displayName || 'Admin',
        status: 'completed',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'orders'), order);

      setLastOrder(order);
      clearCart();
      setSelectedCustomer(null);
      setCashReceived('');
      setGlobalDiscount(0);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      toast.success('Payment processed successfully!');
    } catch {
      toast.error('Failed to process payment');
    }

    setProcessing(false);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <Layout title="POS Billing" subtitle="Point of Sale Terminal">
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Left - Products Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products by name or scan barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl
                  pl-10 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400
                  focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <Barcode className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all
                    ${selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                >
                  {'icon' in cat && <span>{(cat as any).icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product as Product)}
                  disabled={product.stock === 0}
                  className={`relative bg-white dark:bg-slate-800 rounded-xl p-3 text-left border transition-all duration-200 group
                    ${product.stock === 0
                      ? 'opacity-50 cursor-not-allowed border-slate-100 dark:border-slate-700'
                      : 'border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md active:scale-95'
                    }`}
                >
                  <div className={`w-full aspect-square rounded-lg mb-3 flex items-center justify-center text-2xl
                    ${product.stock === 0 ? 'bg-slate-50 dark:bg-slate-700' : 'bg-indigo-50 dark:bg-indigo-500/10'}`}>
                    {product.image
                      ? <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      : <span>{DEMO_CATEGORIES.find(c => c.id === product.categoryId)?.icon || '📦'}</span>
                    }
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-white truncate mb-1">{product.name}</p>
                  <p className="text-xs text-slate-400 mb-2">{product.category}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">₹{product.price}</span>
                    {product.stock === 0
                      ? <Badge variant="danger" size="sm">Out</Badge>
                      : product.stock <= product.lowStockAlert
                        ? <Badge variant="warning" size="sm">{product.stock}</Badge>
                        : <Badge variant="success" size="sm">{product.stock}</Badge>
                    }
                  </div>

                  {product.stock > 0 && (
                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 rounded-xl transition-colors flex items-center justify-center">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-400">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right - Cart Panel */}
        <div className="w-80 xl:w-96 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex-shrink-0">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Cart</span>
              {cart.length > 0 && (
                <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-700/50">
            <div className="relative">
              <button
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-left
                  hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700"
              >
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs flex-1 truncate text-slate-600 dark:text-slate-400">
                  {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                </span>
                {selectedCustomer
                  ? <X className="w-3 h-3 text-slate-400" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} />
                  : <ChevronDown className="w-3 h-3 text-slate-400" />
                }
              </button>

              {showCustomerSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                  rounded-xl shadow-lg z-20 overflow-hidden">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search customer..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600
                        focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowCustomerSearch(false);
                          setCustomerSearch('');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left"
                      >
                        <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-600">{c.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-800 dark:text-white">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.phone} · {c.loyaltyPoints} pts</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-slate-200 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-400 text-center">Cart is empty<br />
                  <span className="text-xs">Click products to add</span>
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {cart.map((item) => (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    onQtyChange={(qty) => updateCartQty(item.productId, qty)}
                    onRemove={() => removeFromCart(item.productId)}
                    onDiscountChange={(d) => updateCartDiscount(item.productId, d)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 flex-1">Global Discount</span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15, 20].map(d => (
                  <button
                    key={d}
                    onClick={() => setGlobalDiscount(d)}
                    className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                      globalDiscount === d
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Item Discounts</span>
                <span className="text-emerald-500">-{formatCurrency(cartDiscount)}</span>
              </div>
              {globalDiscount > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Global Discount ({globalDiscount}%)</span>
                  <span className="text-emerald-500">-{formatCurrency(globalDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Tax (GST)</span>
                <span>{formatCurrency(cartTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-700">
                <span>Total</span>
                <span className="text-indigo-600">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { method: 'cash' as const, icon: Banknote, label: 'Cash' },
                { method: 'upi' as const, icon: Smartphone, label: 'UPI' },
                { method: 'card' as const, icon: CreditCard, label: 'Card' },
              ].map(({ method, icon: Icon, label }) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-xs font-medium
                    ${paymentMethod === method
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-1.5">
                <input
                  type="number"
                  placeholder="Cash received amount..."
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl
                    px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                {cashReceived && cashChange >= 0 && (
                  <div className="flex justify-between text-xs font-semibold px-1">
                    <span className="text-slate-500">Change</span>
                    <span className="text-emerald-500">{formatCurrency(cashChange)}</span>
                  </div>
                )}
                {cashReceived && cashChange < 0 && (
                  <p className="text-xs text-red-500 text-center">Insufficient amount</p>
                )}
              </div>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0 || (paymentMethod === 'cash' && cashReceived !== '' && cashChange < 0)}
              icon={<Receipt className="w-4 h-4" />}
            >
              Charge {finalTotal > 0 && formatCurrency(finalTotal)}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Confirm Payment"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Customer</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {selectedCustomer?.name || 'Walk-in Customer'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Items</span>
              <span className="font-medium text-slate-900 dark:text-white">{cart.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Payment</span>
              <span className="font-medium text-slate-900 dark:text-white capitalize">{paymentMethod}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
              <span className="text-slate-900 dark:text-white">Total Amount</span>
              <span className="text-indigo-600">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} fullWidth>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleProcessPayment}
              loading={processing}
              icon={<Check className="w-4 h-4" />}
              fullWidth
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {lastOrder && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          order={lastOrder}
          onPrint={handlePrintReceipt}
        />
      )}
    </Layout>
  );
}

// Cart Item Row Component
function CartItemRow({ item, onQtyChange, onRemove, onDiscountChange }: {
  item: CartItem;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
  onDiscountChange: (d: number) => void;
}) {
  const [showDiscount, setShowDiscount] = useState(false);
  const total = item.price * item.quantity * (1 - item.discount / 100);

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
          {/* ✅ FIX 1: Nested .find().find() tha — esbuild "." parse nahi kar pa raha tha */}
          <span className="text-sm">
            {(() => {
              const prod = DEMO_PRODUCTS.find(p => p.id === item.productId);
              const cat = prod ? DEMO_CATEGORIES.find(c => c.id === prod.categoryId) : null;
              return cat?.icon || '📦';
            })()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-slate-800 dark:text-white truncate">{item.name}</p>
            <button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">₹{item.price} × {item.quantity}</p>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
              <button
                onClick={() => onQtyChange(item.quantity - 1)}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Minus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              </button>
              <span className="w-6 text-center text-xs font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
              <button
                onClick={() => onQtyChange(item.quantity + 1)}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Plus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDiscount(!showDiscount)}
                className={`text-xs px-1.5 py-0.5 rounded-md transition-colors flex items-center gap-1
                  ${item.discount > 0
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                    : 'text-slate-300 hover:text-slate-500'
                  }`}
              >
                <Tag className="w-3 h-3" />
                {item.discount > 0 ? `${item.discount}%` : ''}
              </button>
              <span className="text-xs font-bold text-indigo-600">₹{total.toFixed(0)}</span>
            </div>
          </div>

          {showDiscount && (
            <div className="flex gap-1 mt-2">
              {[0, 5, 10, 15, 20, 25].map(d => (
                <button
                  key={d}
                  onClick={() => { onDiscountChange(d); setShowDiscount(false); }}
                  className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                    item.discount === d
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {d}%
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Receipt Modal Component
function ReceiptModal({ isOpen, onClose, order, onPrint }: {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onPrint: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt" size="sm">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Payment Successful!</h3>
        <p className="text-xs text-slate-400 mt-1">Order {order.orderId}</p>
      </div>

      <div id="receipt" className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 text-xs space-y-3">
        <div className="text-center border-b border-dashed border-slate-200 dark:border-slate-700 pb-3">
          <p className="font-bold text-sm text-slate-900 dark:text-white">{DEMO_SETTINGS.storeName}</p>
          <p className="text-slate-400">{DEMO_SETTINGS.storeAddress}</p>
          <p className="text-slate-400">{DEMO_SETTINGS.storePhone}</p>
        </div>

        <div className="flex justify-between text-slate-500">
          <span>Date: {format(order.createdAt, 'dd/MM/yyyy HH:mm')}</span>
          <span>#{order.orderId}</span>
        </div>

        <div className="border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
          {order.items.map((item: CartItem, i: number) => (
            <div key={i} className="flex justify-between py-1 text-slate-700 dark:text-slate-300">
              <span className="truncate max-w-[160px]">{item.name} × {item.quantity}</span>
              <span>₹{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 text-slate-600 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.subtotal.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-₹{order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax (GST)</span>
            <span>₹{order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white border-t border-dashed border-slate-200 dark:border-slate-700 pt-2">
            <span>TOTAL</span>
            <span>₹{order.total.toFixed(2)}</span>
          </div>
        </div>

        {order.paymentMethod === 'cash' && (
          <div className="space-y-1 text-slate-500">
            <div className="flex justify-between">
              <span>Cash Received</span>
              <span>₹{order.cashReceived?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Change</span>
              <span>₹{order.cashChange?.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="text-center border-t border-dashed border-slate-200 dark:border-slate-700 pt-3 text-slate-400">
          <p>Payment: <span className="capitalize font-medium text-slate-600 dark:text-slate-300">{order.paymentMethod}</span></p>
          <p className="mt-2 font-medium text-slate-600 dark:text-slate-300">{DEMO_SETTINGS.receiptFooter}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={onClose} fullWidth icon={<X className="w-4 h-4" />}>
          Close
        </Button>
        <Button onClick={onPrint} fullWidth icon={<Printer className="w-4 h-4" />}>
          Print
        </Button>
      </div>
    </Modal>
  );
}
