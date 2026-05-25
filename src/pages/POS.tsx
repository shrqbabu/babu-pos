// POS Billing Page - The core feature of SmartPOS
import { useState, useRef } from 'react';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, User,
  Printer, CreditCard, Smartphone, Banknote, X, Check,
  Receipt, Percent, Package, ScanLine
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { useCollection } from '../hooks/useFirestore';
import { Collections } from '../firebase/firestore';
import { createOrder } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'green' },
  { id: 'card', label: 'Card', icon: CreditCard, color: 'blue' },
  { id: 'upi', label: 'UPI', icon: Smartphone, color: 'purple' },
];

export default function POS() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const {
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
    discount, setDiscount, taxRate, paymentMethod, setPaymentMethod,
    selectedCustomer, setSelectedCustomer,
    subtotal, discountAmount, taxAmount, total, itemCount,
  } = usePOS();

  const { data: products } = useCollection(Collections.PRODUCTS);
  const { data: customers } = useCollection(Collections.CUSTOMERS);
  const { data: categories } = useCollection(Collections.CATEGORIES);
  const { userData } = useAuth();

  // Filter products
  const filteredProducts = products.filter((p: any) => {
    const matchSearch = !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.includes(searchQuery);
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const inStock = p.stock === undefined || p.stock > 0;
    return matchSearch && matchCategory && inStock;
  });

  const handleAddToCart = (product: any) => {
    if (product.stock !== undefined && product.stock <= 0) {
      toast.error('Product out of stock');
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      barcode: product.barcode,
      category: product.category,
    });
    toast.success(`${product.name} added`, { duration: 800 });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setProcessing(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        subtotal,
        discount,
        discountAmount,
        taxRate,
        taxAmount,
        total,
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) || total : total,
        change: paymentMethod === 'cash' ? (parseFloat(cashReceived) || total) - total : 0,
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || null,
        cashierId: userData?.uid,
        cashierName: userData?.displayName,
        status: 'completed',
      };

      const result = await createOrder(orderData);
      setLastOrder({ ...orderData, ...result });
      clearCart();
      setDiscountInput('');
      setCashReceived('');
      setShowReceiptModal(true);
      toast.success('Order completed! 🎉');
    } catch (err) {
      console.error(err);
      toast.error('Failed to process order. Check Firebase connection.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const change = paymentMethod === 'cash' ? (parseFloat(cashReceived) || 0) - total : 0;

  return (
    <div className="flex h-[calc(100vh-73px)] gap-4 overflow-hidden">
      {/* Left - Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search & Filter */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or barcode... (F2)"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 bg-gray-800 rounded-xl px-1 border border-gray-700">
            <ScanLine className="w-4 h-4 text-gray-500 ml-2" />
            <span className="text-gray-500 text-xs px-1">Scan</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 flex-shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All Products
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.name
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-600">
              <Package className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Add products from the Products page</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {filteredProducts.map((product: any) => {
                const inCart = cart.find(c => c.productId === product.id);
                const outOfStock = product.stock !== undefined && product.stock <= 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => !outOfStock && handleAddToCart(product)}
                    disabled={outOfStock}
                    className={`bg-gray-800 border rounded-xl p-3 text-left transition-all duration-200 relative group ${
                      outOfStock
                        ? 'opacity-50 cursor-not-allowed border-gray-700'
                        : inCart
                        ? 'border-indigo-500 shadow-lg shadow-indigo-900/20 hover:border-indigo-400'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-750 active:scale-95'
                    }`}
                  >
                    {/* Image */}
                    <div className="w-full aspect-square rounded-lg bg-gray-700 mb-3 overflow-hidden flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    {/* Info */}
                    <p className="text-white text-sm font-medium truncate">{product.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{product.category || 'General'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-indigo-400 font-bold text-sm">{formatCurrency(product.price || 0)}</p>
                      {product.stock !== undefined && (
                        <span className={`text-xs ${product.stock <= 10 ? 'text-yellow-500' : 'text-gray-600'}`}>
                          {outOfStock ? 'Out' : `${product.stock} left`}
                        </span>
                      )}
                    </div>
                    {/* Cart Badge */}
                    {inCart && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {inCart.quantity}
                      </div>
                    )}
                    {/* Add indicator */}
                    {!outOfStock && (
                      <div className="absolute top-2 left-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right - Cart & Checkout */}
      <div className="w-80 xl:w-96 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex-shrink-0">
        {/* Cart Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-semibold">Cart</h3>
            {itemCount > 0 && (
              <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">{itemCount}</span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-gray-500 hover:text-red-400 transition-colors text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Customer Select */}
        <button
          onClick={() => setShowCustomerModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-sm text-gray-400 flex-1 text-left">
            {selectedCustomer ? selectedCustomer.name : 'Select Customer (optional)'}
          </span>
          {selectedCustomer && (
            <button
              onClick={e => { e.stopPropagation(); setSelectedCustomer(null); }}
              className="text-gray-600 hover:text-red-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </button>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 py-12">
              <ShoppingCart className="w-10 h-10 mb-3" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click products to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  <p className="text-indigo-400 text-xs">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-md bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-white text-sm w-6 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-md bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="border-t border-gray-800 p-4 space-y-3">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-gray-500" />
            <input
              type="number"
              value={discountInput}
              onChange={e => {
                setDiscountInput(e.target.value);
                setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)));
              }}
              placeholder="Discount %"
              min="0"
              max="100"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-gray-600"
            />
          </div>

          {/* Summary */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="text-white">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount ({discount}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>GST ({taxRate}%)</span>
              <span className="text-white">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-gray-700">
              <span>Total</span>
              <span className="text-indigo-400">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map(method => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === method.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {method.label}
                </button>
              );
            })}
          </div>

          {/* Cash received input */}
          {paymentMethod === 'cash' && (
            <div>
              <input
                type="number"
                value={cashReceived}
                onChange={e => setCashReceived(e.target.value)}
                placeholder={`Cash received (min ${formatCurrency(total)})`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 placeholder-gray-600"
              />
              {cashReceived && parseFloat(cashReceived) >= total && (
                <p className="text-green-400 text-xs mt-1 text-right">
                  Change: {formatCurrency(change)}
                </p>
              )}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                Charge {formatCurrency(total)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCustomerModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Select Customer</h3>
              <button onClick={() => setShowCustomerModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No customers found. Add from Customers page.</p>
              ) : (
                customers.map((customer: any) => (
                  <button
                    key={customer.id}
                    onClick={() => { setSelectedCustomer(customer); setShowCustomerModal(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                      {customer.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{customer.name}</p>
                      <p className="text-gray-500 text-xs">{customer.phone} · {customer.loyaltyPoints || 0} pts</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            {/* Receipt Header */}
            <div className="bg-gray-900 px-6 py-4 text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">Payment Successful!</h3>
              <p className="text-gray-400 text-sm font-mono">{lastOrder.orderId}</p>
            </div>
            {/* Receipt Body */}
            <div className="p-6 font-mono text-sm text-gray-900">
              <div className="text-center mb-4">
                <p className="font-bold text-xl">SmartPOS</p>
                <p className="text-gray-500 text-xs">{new Date().toLocaleString('en-IN')}</p>
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div className="space-y-1">
                {lastOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="flex-1">{item.name} × {item.quantity}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(lastOrder.subtotal)}</span></div>
                {lastOrder.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({lastOrder.discount}%)</span><span>-{formatCurrency(lastOrder.discountAmount)}</span></div>}
                <div className="flex justify-between"><span>GST ({lastOrder.taxRate}%)</span><span>{formatCurrency(lastOrder.taxAmount)}</span></div>
                <div className="flex justify-between font-bold text-sm border-t border-gray-200 pt-1 mt-1"><span>TOTAL</span><span>{formatCurrency(lastOrder.total)}</span></div>
                {lastOrder.paymentMethod === 'cash' && <>
                  <div className="flex justify-between text-gray-500"><span>Cash</span><span>{formatCurrency(lastOrder.cashReceived)}</span></div>
                  <div className="flex justify-between text-green-600"><span>Change</span><span>{formatCurrency(lastOrder.change)}</span></div>
                </>}
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div className="text-center text-xs text-gray-500">
                <p>Payment: {lastOrder.paymentMethod?.toUpperCase()}</p>
                <p className="mt-1">Thank you for shopping!</p>
                <p>Powered by SmartPOS</p>
              </div>
            </div>
            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
