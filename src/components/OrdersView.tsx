import { useState } from 'react';
import { Search, RefreshCw, Eye, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Order } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onRefund: (id: string) => void;
}

const statusColor = {
  completed: { bg: 'rgba(16,185,129,0.15)', text: '#10b981', icon: CheckCircle },
  refunded: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', icon: XCircle },
  pending: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', icon: Clock },
};

const payIcon = { cash: '💵', card: '💳', digital: '📱' };

export default function OrdersView({ orders, onRefund }: OrdersViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = orders.filter(o => {
    const matchSearch = String(o.orderNumber).includes(search) || o.cashier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Orders</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>{orders.length} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            className="pos-input w-full pl-9 pr-4 py-2.5 text-sm"
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'completed', 'refunded', 'pending'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{
                background: statusFilter === s ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(30,41,59,0.8)',
                color: statusFilter === s ? 'white' : '#94a3b8',
                border: `1px solid ${statusFilter === s ? 'transparent' : 'rgba(51,65,85,0.5)'}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="overflow-auto h-full">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(51,65,85,0.8)', background: 'rgba(15,23,42,0.5)' }}>
                {['Order #', 'Date', 'Items', 'Payment', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const { bg, text, icon: Icon } = statusColor[order.status] ?? statusColor.pending;
                return (
                  <tr key={order.id} className="table-row" style={{ borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
                    <td className="px-4 py-3">
                      <span className="font-bold text-sm" style={{ color: '#a5b4fc' }}>#{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{order.items.length} items</td>
                    <td className="px-4 py-3 text-sm">
                      <span>{payIcon[order.paymentMethod]} <span style={{ color: '#94a3b8' }} className="capitalize text-xs">{order.paymentMethod}</span></span>
                    </td>
                    <td className="px-4 py-3 font-bold text-sm" style={{ color: '#10b981' }}>${order.total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold w-fit" style={{ background: bg, color: text }}>
                        <Icon size={10} />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors"
                          style={{ color: '#6366f1' }}
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        {order.status === 'completed' && (
                          <button
                            onClick={() => onRefund(order.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                            style={{ color: '#ef4444' }}
                            title="Refund"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="text-4xl mb-2">📋</div>
                    <p style={{ color: '#64748b' }}>No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="glass-card w-full max-w-lg mx-4 p-6 slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Order #{selectedOrder.orderNumber}</h3>
                <p className="text-xs" style={{ color: '#64748b' }}>{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl hover:bg-white/10" style={{ color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {selectedOrder.items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'rgba(15,23,42,0.5)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>×{item.quantity} @ ${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: '#a5b4fc' }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(15,23,42,0.5)' }}>
              <div className="flex justify-between text-sm" style={{ color: '#64748b' }}>
                <span>Subtotal</span><span className="text-white">${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-sm" style={{ color: '#f59e0b' }}>
                  <span>Discount</span><span>-${selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm" style={{ color: '#64748b' }}>
                <span>Tax</span><span className="text-white">${selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid rgba(51,65,85,0.5)' }}>
                <span className="text-white">Total</span>
                <span style={{ color: '#a5b4fc' }}>${selectedOrder.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: '#64748b' }}>
                <span>Payment</span>
                <span className="capitalize text-white">{payIcon[selectedOrder.paymentMethod]} {selectedOrder.paymentMethod}</span>
              </div>
              {selectedOrder.cashReceived && (
                <div className="flex justify-between text-sm" style={{ color: '#64748b' }}>
                  <span>Cash received</span><span className="text-white">${selectedOrder.cashReceived.toFixed(2)}</span>
                </div>
              )}
              {selectedOrder.change && selectedOrder.change > 0 && (
                <div className="flex justify-between text-sm" style={{ color: '#10b981' }}>
                  <span>Change</span><span>${selectedOrder.change.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
