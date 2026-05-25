import { useState, useMemo } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Search, ShoppingCart, Eye, Calendar, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function Orders() {
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewOrder, setViewOrder] = useState<any>(null);

  // Combine demo + localStorage orders
 const [allOrders, setAllOrders] = useState<any[]>([]);

useEffect(() => {
  const fetchOrders = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));

      const firebaseOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllOrders(firebaseOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  fetchOrders();
}, []);

  const filtered = allOrders.filter((o: any) => {
    const matchSearch = !search || o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchMethod = !filterMethod || o.paymentMethod === filterMethod;
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchMethod && matchStatus;
  });

  // Stats
  const totalRevenue = filtered.reduce((s: number, o: any) => s + o.total, 0);
  const completedOrders = filtered.filter((o: any) => o.status === 'completed').length;

  const columns = [
    {
      key: 'orderId', title: 'Order ID',
      render: (_: any, row: any) => (
        <span className="text-sm font-mono font-semibold text-indigo-600 dark:text-indigo-400">
          {row.orderId}
        </span>
      )
    },
    {
      key: 'customerName', title: 'Customer',
      render: (_: any, row: any) => (
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-white">{row.customerName}</p>
          <p className="text-xs text-slate-400">{row.items?.length} items</p>
        </div>
      )
    },
    {
      key: 'createdAt', title: 'Date & Time',
      render: (_: any, row: any) => {
        try {
          const d = row.createdAt?.toDate ? row.createdAt.toDate() : new Date(row.createdAt);
          return <span className="text-sm text-slate-600 dark:text-slate-400">{format(d, 'dd MMM yyyy, HH:mm')}</span>;
        } catch { return <span className="text-sm text-slate-400">-</span>; }
      }
    },
    {
      key: 'paymentMethod', title: 'Payment',
      render: (v: string) => {
        const icons: Record<string, string> = { cash: '💵', upi: '📱', card: '💳' };
        return (
          <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 capitalize">
            <span>{icons[v] || '💰'}</span>{v}
          </span>
        );
      }
    },
    {
      key: 'total', title: 'Amount', align: 'right' as const,
      render: (v: number) => (
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(v)}</span>
      )
    },
    {
      key: 'status', title: 'Status', align: 'center' as const,
      render: (v: string) => (
        <Badge variant={v === 'completed' ? 'success' : v === 'refunded' ? 'danger' : 'warning'}>
          {v}
        </Badge>
      )
    },
    {
      key: 'actions', title: '', align: 'right' as const,
      render: (_: any, row: any) => (
        <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => setViewOrder(row)}>
          View
        </Button>
      )
    }
  ];

  return (
    <Layout title="Orders" subtitle="View and manage all transactions">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: filtered.length, color: 'indigo' },
          { label: 'Completed', value: completedOrders, color: 'emerald' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'blue' },
          { label: 'Avg Order', value: filtered.length ? formatCurrency(totalRevenue / filtered.length) : '₹0', color: 'amber' },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold text-${s.color}-600 dark:text-${s.color}-400`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600
                rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
              className="text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-600 dark:text-slate-400 focus:outline-none">
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-600 dark:text-slate-400 focus:outline-none">
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={filtered.slice(0, 50)}
          emptyMessage="No orders found"
          emptyIcon={<ShoppingCart className="w-12 h-12" />}
          rowKey={(r) => r.id}
        />
      </Card>

      {/* Order Detail Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title="Order Details" size="md">
        {viewOrder && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{viewOrder.orderId}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(() => { try { const d = viewOrder.createdAt?.toDate ? viewOrder.createdAt.toDate() : new Date(viewOrder.createdAt); return format(d, 'dd MMM yyyy, HH:mm'); } catch { return '-'; } })()}
                </p>
              </div>
              <Badge variant={viewOrder.status === 'completed' ? 'success' : 'danger'}>
                {viewOrder.status}
              </Badge>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-medium text-slate-900 dark:text-white">{viewOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className="font-medium text-slate-900 dark:text-white capitalize">{viewOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier</span>
                <span className="font-medium text-slate-900 dark:text-white">{viewOrder.cashierName || 'N/A'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Items</h4>
              <div className="space-y-2">
                {viewOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm bg-slate-50 dark:bg-slate-900/30 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-white">{item.name}</span>
                      <span className="text-slate-400 ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span><span>{formatCurrency(viewOrder.subtotal)}</span>
              </div>
              {viewOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span><span>-{formatCurrency(viewOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Tax</span><span>{formatCurrency(viewOrder.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white">
                <span>Total</span><span className="text-indigo-600">{formatCurrency(viewOrder.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
