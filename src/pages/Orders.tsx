// Orders Page for SmartPOS
import { useState } from 'react';
import { Search, Eye, Receipt, X } from 'lucide-react';
import { useCollection } from '../hooks/useFirestore';
import { Collections, orderBy, limit } from '../firebase/firestore';
import Badge from '../components/UI/Badge';
import { format } from 'date-fns';

export default function Orders() {
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filterMethod, setFilterMethod] = useState('all');

  const { data: orders, loading } = useCollection(Collections.ORDERS, [orderBy('createdAt', 'desc'), limit(200)]);

  const filtered = orders.filter((o: any) => {
    const matchSearch = !search ||
      o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      o.cashierName?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchMethod = filterMethod === 'all' || o.paymentMethod === filterMethod;
    return matchSearch && matchMethod;
  });

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return format(date, 'dd MMM yyyy, hh:mm a');
  };

  const totalRevenue = filtered.reduce((s: number, o: any) => s + (o.total || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Orders</h1>
          <p className="text-gray-500 text-sm">{orders.length} total orders</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-right">
          <p className="text-gray-500 text-xs">Showing Revenue</p>
          <p className="text-indigo-400 font-bold text-lg">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Order ID, cashier or customer..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={filterMethod}
          onChange={e => setFilterMethod(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-gray-300 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <Receipt className="w-12 h-12 mb-3" />
            <p className="font-medium">No orders found</p>
            <p className="text-sm mt-1">Process sales from POS Billing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-500">
                  <th className="text-left px-5 py-3 font-medium">Order ID</th>
                  <th className="text-left px-5 py-3 font-medium">Date & Time</th>
                  <th className="text-left px-5 py-3 font-medium">Customer</th>
                  <th className="text-left px-5 py-3 font-medium">Cashier</th>
                  <th className="text-left px-5 py-3 font-medium">Items</th>
                  <th className="text-left px-5 py-3 font-medium">Payment</th>
                  <th className="text-left px-5 py-3 font-medium">Total</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-indigo-400 text-xs">
                      {order.orderId?.slice(0, 18) || order.id?.slice(0, 10)}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-gray-300">
                      {order.customerName || <span className="text-gray-600">Walk-in</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-300">{order.cashierName || '—'}</td>
                    <td className="px-5 py-3 text-gray-400">{order.items?.length || 0} items</td>
                    <td className="px-5 py-3">
                      <span className={`capitalize text-xs px-2.5 py-1 rounded-lg font-medium ${
                        order.paymentMethod === 'cash' ? 'bg-green-500/10 text-green-400' :
                        order.paymentMethod === 'card' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-purple-500/10 text-purple-400'
                      }`}>
                        {order.paymentMethod || 'cash'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white font-semibold">{formatCurrency(order.total || 0)}</td>
                    <td className="px-5 py-3">
                      <Badge
                        label={order.status || 'Completed'}
                        color={order.status === 'cancelled' ? 'red' : 'green'}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
              <h3 className="text-white font-semibold">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Order ID</p>
                  <p className="text-indigo-400 font-mono text-xs mt-0.5">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="text-white text-xs mt-0.5">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cashier</p>
                  <p className="text-white mt-0.5">{selectedOrder.cashierName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="text-white mt-0.5">{selectedOrder.customerName || 'Walk-in'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment</p>
                  <p className="text-white capitalize mt-0.5">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <Badge label={selectedOrder.status || 'Completed'} color={selectedOrder.status === 'cancelled' ? 'red' : 'green'} />
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-gray-500 text-sm mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl p-3 text-sm">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-gray-500 text-xs">× {item.quantity} @ {formatCurrency(item.price)}</p>
                      </div>
                      <span className="text-indigo-400 font-semibold">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal || 0)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount ({selectedOrder.discount}%)</span>
                    <span>-{formatCurrency(selectedOrder.discountAmount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>GST ({selectedOrder.taxRate}%)</span>
                  <span>{formatCurrency(selectedOrder.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-gray-700">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total || 0)}</span>
                </div>
                {selectedOrder.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between text-gray-400">
                      <span>Cash Received</span>
                      <span>{formatCurrency(selectedOrder.cashReceived || 0)}</span>
                    </div>
                    <div className="flex justify-between text-green-400">
                      <span>Change</span>
                      <span>{formatCurrency(selectedOrder.change || 0)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
