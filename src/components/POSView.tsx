import { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, X, Tag, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { Product, CartItem, PaymentMethod } from '../types';
import { useOrders } from '../hooks/useOrders';

interface POSViewProps {
  products: Product[];
  onStockUpdate: (id: string, delta: number) => void;
}

const CATEGORIES = ['All', 'Juices', 'Smoothies', 'Shakes', 'Cold Drinks', 'Coffee'];
const TAX_RATE = 0.08;

export default function POSView({ products, onStockUpdate }: POSViewProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [orderDiscount, setOrderDiscount] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const { placeOrder, nextOrderNumber } = useOrders();

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = category === 'All' || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter(i => i.quantity > 0);
    });
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = Math.min((parseFloat(orderDiscount) || 0), subtotal);
  const taxable = subtotal - discountAmt;
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;
  const change = (parseFloat(cashReceived) || 0) - total;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const orderNum = nextOrderNumber();
    const order = {
      items: cart,
      subtotal,
      tax,
      discount: discountAmt,
      total,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) || 0 : undefined,
      change: paymentMethod === 'cash' ? change : undefined,
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
      cashier: 'Admin',
      orderNumber: orderNum,
    };
    await placeOrder(order);
    // Update stock
    for (const item of cart) {
      onStockUpdate(item.id, -item.quantity);
    }
    setLastOrder({ ...order, id: `#${orderNum}` });
    setShowCheckout(false);
    setShowReceipt(true);
    setCart([]);
    setCashReceived('');
    setOrderDiscount('');
  };

  const paymentMethods = [
    { id: 'cash' as PaymentMethod, label: 'Cash', icon: Banknote },
    { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard },
    { id: 'digital' as PaymentMethod, label: 'Digital', icon: Smartphone },
  ];

  const quickCash = [5, 10, 20, 50, 100];

  return (
    <div className="flex h-full gap-0">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0f172a' }}>
        {/* Search + Filters */}
        <div className="p-4 space-y-3" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
            <input
              className="pos-input w-full pl-9 pr-4 py-2.5 text-sm"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`category-pill px-3 py-1.5 rounded-full text-xs font-semibold ${category === cat ? 'active' : ''}`}
                style={{
                  background: category === cat ? undefined : 'rgba(30,41,59,0.8)',
                  color: category === cat ? 'white' : '#94a3b8',
                  border: `1px solid ${category === cat ? 'transparent' : 'rgba(51,65,85,0.8)'}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filtered.map(product => {
              const inCart = cart.find(i => i.id === product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="product-card rounded-2xl p-4 relative overflow-hidden"
                  style={{
                    background: 'rgba(30,41,59,0.7)',
                    border: `1px solid ${inCart ? 'rgba(99,102,241,0.4)' : 'rgba(51,65,85,0.5)'}`,
                    opacity: product.stock === 0 ? 0.5 : 1,
                    cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {inCart && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#6366f1', color: 'white' }}>
                      {inCart.quantity}
                    </div>
                  )}
                  <div className="text-3xl mb-2">{product.emoji}</div>
                  <p className="font-semibold text-sm text-white leading-tight mb-1">{product.name}</p>
                  <p className="text-xs mb-2" style={{ color: '#64748b' }}>{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: '#a5b4fc' }}>${product.price.toFixed(2)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: product.stock > 10 ? 'rgba(16,185,129,0.15)' : product.stock > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: product.stock > 10 ? '#10b981' : product.stock > 0 ? '#f59e0b' : '#ef4444',
                    }}>
                      {product.stock > 0 ? `${product.stock} left` : 'Out'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <span className="text-4xl mb-2">🔍</span>
              <p className="text-sm" style={{ color: '#64748b' }}>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-80 xl:w-96 flex flex-col h-full" style={{ background: '#1e293b', borderLeft: '1px solid rgba(99,102,241,0.15)' }}>
        {/* Cart Header */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} style={{ color: '#6366f1' }} />
            <span className="font-bold text-white">Cart</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: '#ef4444' }}>
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="text-5xl mb-3">🛒</div>
              <p className="font-semibold text-white mb-1">Cart is empty</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Click on products to add them</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="cart-item rounded-xl p-3" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>${item.price.toFixed(2)} each</p>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-1 rounded-lg hover:bg-red-500/15 transition-colors" style={{ color: '#64748b' }}>
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)} className="qty-btn w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="qty-btn w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-bold text-sm" style={{ color: '#a5b4fc' }}>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {cart.length > 0 && (
          <div className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}>
            {/* Discount */}
            <div className="flex items-center gap-2">
              <Tag size={14} style={{ color: '#f59e0b' }} />
              <input
                type="number"
                className="pos-input flex-1 px-3 py-1.5 text-sm"
                placeholder="Discount ($)"
                value={orderDiscount}
                onChange={e => setOrderDiscount(e.target.value)}
                min="0"
                max={subtotal}
              />
            </div>

            {/* Totals */}
            <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(15,23,42,0.5)' }}>
              <div className="flex justify-between text-xs" style={{ color: '#64748b' }}>
                <span>Subtotal</span><span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-xs" style={{ color: '#f59e0b' }}>
                  <span>Discount</span><span>-${discountAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs" style={{ color: '#64748b' }}>
                <span>Tax (8%)</span><span className="text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1" style={{ borderTop: '1px solid rgba(51,65,85,0.5)', paddingTop: '6px' }}>
                <span className="text-white">Total</span>
                <span style={{ color: '#a5b4fc' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => setShowCheckout(true)}
              className="checkout-btn w-full py-3 rounded-xl font-bold text-white text-sm"
            >
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="glass-card w-full max-w-md mx-4 p-6 slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className="p-2 rounded-xl hover:bg-white/10 transition-colors" style={{ color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Order Summary */}
            <div className="rounded-xl p-4 mb-4 space-y-1" style={{ background: 'rgba(15,23,42,0.5)' }}>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span style={{ color: '#94a3b8' }}>{item.emoji} {item.name} × {item.quantity}</span>
                  <span className="text-white font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
                <span className="text-white">Total</span>
                <span style={{ color: '#a5b4fc' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <p className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>PAYMENT METHOD</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {paymentMethods.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className="py-3 rounded-xl flex flex-col items-center gap-1 text-xs font-semibold transition-all"
                  style={{
                    background: paymentMethod === id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(15,23,42,0.5)',
                    color: paymentMethod === id ? 'white' : '#94a3b8',
                    border: `1px solid ${paymentMethod === id ? 'transparent' : 'rgba(51,65,85,0.5)'}`,
                    boxShadow: paymentMethod === id ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
                  }}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>

            {/* Cash Received */}
            {paymentMethod === 'cash' && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>CASH RECEIVED</p>
                <input
                  type="number"
                  className="pos-input w-full px-4 py-3 text-lg font-bold"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {quickCash.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashReceived(String(Math.ceil(total / amt) * amt))}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-indigo-500/20"
                      style={{ background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.5)' }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                {change > 0 && (
                  <div className="mt-3 p-3 rounded-xl flex justify-between" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <span className="text-sm font-semibold" style={{ color: '#10b981' }}>Change</span>
                    <span className="text-sm font-bold" style={{ color: '#10b981' }}>${change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={paymentMethod === 'cash' && (parseFloat(cashReceived) || 0) < total}
              className="checkout-btn w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Sale 🎉
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="glass-card w-full max-w-sm mx-4 p-6 slide-up" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(16,185,129,0.2)' }}>
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-white">Sale Complete!</h2>
              <p className="text-sm" style={{ color: '#64748b' }}>Order {lastOrder.id}</p>
            </div>

            <div className="rounded-xl p-4 mb-4 space-y-2" style={{ background: 'rgba(15,23,42,0.5)', fontFamily: 'monospace' }}>
              <p className="text-center text-sm font-bold text-white mb-3">— RECEIPT —</p>
              {lastOrder.items.map((item: CartItem) => (
                <div key={item.id} className="flex justify-between text-xs" style={{ color: '#94a3b8' }}>
                  <span>{item.name} ×{item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 space-y-1" style={{ borderColor: 'rgba(51,65,85,0.5)' }}>
                {lastOrder.discount > 0 && (
                  <div className="flex justify-between text-xs" style={{ color: '#f59e0b' }}>
                    <span>Discount</span><span>-${lastOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs" style={{ color: '#64748b' }}>
                  <span>Tax</span><span>${lastOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-white">Total</span>
                  <span style={{ color: '#a5b4fc' }}>${lastOrder.total.toFixed(2)}</span>
                </div>
                {lastOrder.paymentMethod === 'cash' && lastOrder.change > 0 && (
                  <div className="flex justify-between text-xs" style={{ color: '#10b981' }}>
                    <span>Change</span><span>${lastOrder.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowReceipt(false)}
              className="checkout-btn w-full py-3 rounded-xl font-bold text-white"
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
