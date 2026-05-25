// Dashboard Page for SmartPOS
import { useState, useEffect } from 'react';
import {
  ShoppingBag, TrendingUp, Users, Package, DollarSign,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import StatsCard from '../components/UI/StatsCard';
import Badge from '../components/UI/Badge';
import { useCollection } from '../hooks/useFirestore';
import { Collections, orderBy, limit } from '../firebase/firestore';

import { format, subDays } from 'date-fns';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data: orders } = useCollection(Collections.ORDERS, [orderBy('createdAt', 'desc'), limit(100)]);
  const { data: products } = useCollection(Collections.PRODUCTS);
  const { data: customers } = useCollection(Collections.CUSTOMERS);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    const orderDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return orderDate >= today;
  });

  const totalTodaySales = todayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const lowStockProducts = products.filter((p: any) => p.stock !== undefined && p.stock <= (p.minStock || 10));

  // Generate weekly sales chart data
  useEffect(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        day: format(date, 'EEE'),
        date: date,
        sales: 0,
        orders: 0,
      };
    });

    orders.forEach((order: any) => {
      if (!order.createdAt) return;
      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      last7Days.forEach(d => {
        if (format(orderDate, 'yyyy-MM-dd') === format(d.date, 'yyyy-MM-dd')) {
          d.sales += order.total || 0;
          d.orders += 1;
        }
      });
    });

    setSalesData(last7Days.map(d => ({ day: d.day, sales: Math.round(d.sales), orders: d.orders })));
    setRecentOrders(orders.slice(0, 8));
  }, [orders]);

  // Category breakdown
  useEffect(() => {
    const catMap: Record<string, number> = {};
    products.forEach((p: any) => {
      const cat = p.category || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })));
  }, [products]);

  // Best sellers
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.forEach((order: any) => {
    (order.items || []).forEach((item: any) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSales[item.productId].qty += item.quantity;
      productSales[item.productId].revenue += item.price * item.quantity;
    });
  });
  const bestSellers = Object.values(productSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm">
          <p className="text-gray-400 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }} className="font-medium">
              {p.name}: {p.name === 'sales' ? formatCurrency(p.value) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Revenue"
          value={formatCurrency(totalTodaySales)}
          icon={DollarSign}
          trend={12.5}
          trendLabel="vs yesterday"
          color="indigo"
        />
        <StatsCard
          title="Total Orders"
          value={orders.length}
          icon={ShoppingBag}
          trend={8.2}
          trendLabel="this month"
          color="green"
        />
        <StatsCard
          title="Total Customers"
          value={customers.length}
          icon={Users}
          trend={3.1}
          trendLabel="new this week"
          color="blue"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          trend={15.3}
          trendLabel="all time"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold">Sales Overview</h3>
              <p className="text-gray-500 text-xs mt-0.5">Last 7 days performance</p>
            </div>
            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg">Weekly</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={v => `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sales" stroke="#6366f1" fill="url(#salesGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-1">Product Categories</h3>
          <p className="text-gray-500 text-xs mb-4">Distribution by category</p>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {categoryData.slice(0, 4).map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-400 text-xs">{cat.name}</span>
                    </div>
                    <span className="text-white text-xs font-medium">{cat.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-600">
              <Package className="w-8 h-8 mb-2" />
              <p className="text-sm">No products yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Orders</h3>
            <span className="text-gray-500 text-xs">{recentOrders.length} orders</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <ShoppingBag className="w-8 h-8 mb-2" />
              <p className="text-sm">No orders yet</p>
              <p className="text-xs mt-1">Start selling with POS Billing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="text-left pb-3 font-medium">Order ID</th>
                    <th className="text-left pb-3 font-medium">Items</th>
                    <th className="text-left pb-3 font-medium">Payment</th>
                    <th className="text-left pb-3 font-medium">Amount</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 text-indigo-400 font-mono text-xs">{order.orderId?.slice(0, 16) || order.id?.slice(0, 8)}</td>
                      <td className="py-3 text-gray-300">{order.items?.length || 0} items</td>
                      <td className="py-3">
                        <span className="capitalize text-gray-400 text-xs">{order.paymentMethod || 'cash'}</span>
                      </td>
                      <td className="py-3 text-white font-semibold">{formatCurrency(order.total || 0)}</td>
                      <td className="py-3">
                        <Badge label={order.status || 'Completed'} color={order.status === 'cancelled' ? 'red' : 'green'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Best Sellers */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Best Sellers</h3>
            {bestSellers.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {bestSellers.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                      <p className="text-gray-500 text-xs">{item.qty} sold</p>
                    </div>
                    <span className="text-green-400 text-xs font-medium">{formatCurrency(item.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <h3 className="text-white font-semibold">Low Stock Alert</h3>
              {lowStockProducts.length > 0 && (
                <span className="ml-auto bg-yellow-500/10 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                  {lowStockProducts.length}
                </span>
              )}
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-3">All products well-stocked ✓</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 4).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <p className="text-gray-300 text-sm truncate flex-1">{p.name}</p>
                    <span className="text-yellow-400 text-xs font-bold ml-2">{p.stock} left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
