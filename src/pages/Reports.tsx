// Reports & Analytics Page
import { useState } from 'react';
import { Download, TrendingUp, BarChart2, Users, Package } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { useCollection } from '../hooks/useFirestore';
import { Collections, orderBy, limit } from '../firebase/firestore';
import { format, subDays, startOfMonth, eachDayOfInterval } from 'date-fns';

type DateRange = '7d' | '30d' | '90d' | 'mtd';

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { data: orders } = useCollection(Collections.ORDERS, [orderBy('createdAt', 'desc'), limit(500)]);

  const getRangeStart = (): Date => {
    const now = new Date();
    switch (dateRange) {
      case '7d': return subDays(now, 7);
      case '30d': return subDays(now, 30);
      case '90d': return subDays(now, 90);
      case 'mtd': return startOfMonth(now);
    }
  };

  const filteredOrders = orders.filter((o: any) => {
    if (!o.createdAt) return false;
    const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return d >= getRangeStart();
  });

  const totalRevenue = filteredOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalTax = filteredOrders.reduce((s: number, o: any) => s + (o.taxAmount || 0), 0);
  const totalDiscount = filteredOrders.reduce((s: number, o: any) => s + (o.discountAmount || 0), 0);

  // Daily sales data
  const getDays = (): Date[] => {
    const start = getRangeStart();
    const end = new Date();
    if (dateRange === '90d' || dateRange === '30d') {
      // Group by week for 30d+
      return eachDayOfInterval({ start, end });
    }
    return eachDayOfInterval({ start, end });
  };

  const dailyData = getDays().map(date => {
    const dayOrders = filteredOrders.filter((o: any) => {
      if (!o.createdAt) return false;
      const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
    return {
      date: format(date, dateRange === '7d' ? 'EEE' : 'dd MMM'),
      revenue: dayOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
      orders: dayOrders.length,
    };
  });

  // Slice to avoid too many data points
  const chartData = dateRange === '90d'
    ? dailyData.filter((_, i) => i % 7 === 0).slice(-13)
    : dailyData.slice(-30);

  // Payment method breakdown
  const paymentBreakdown = filteredOrders.reduce((acc: any, o: any) => {
    const method = o.paymentMethod || 'cash';
    acc[method] = (acc[method] || 0) + (o.total || 0);
    return acc;
  }, {});
  const paymentData = Object.entries(paymentBreakdown).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  // Best selling products
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  filteredOrders.forEach((order: any) => {
    (order.items || []).forEach((item: any) => {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, qty: 0, revenue: 0 };
      productSales[item.name].qty += item.quantity;
      productSales[item.name].revenue += item.price * item.quantity;
    });
  });
  const bestSellers = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Cashier performance
  const cashierPerf: Record<string, { name: string; orders: number; revenue: number }> = {};
  filteredOrders.forEach((o: any) => {
    const key = o.cashierName || 'Unknown';
    if (!cashierPerf[key]) cashierPerf[key] = { name: key, orders: 0, revenue: 0 };
    cashierPerf[key].orders += 1;
    cashierPerf[key].revenue += o.total || 0;
  });
  const cashierData = Object.values(cashierPerf).sort((a, b) => b.revenue - a.revenue);

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  const exportCSV = () => {
    const rows = [
      ['Order ID', 'Date', 'Cashier', 'Customer', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment Method'],
      ...filteredOrders.map((o: any) => [
        o.orderId, format(o.createdAt?.toDate ? o.createdAt.toDate() : new Date(), 'yyyy-MM-dd HH:mm'),
        o.cashierName, o.customerName || 'Walk-in',
        o.items?.length || 0, o.subtotal, o.discountAmount, o.taxAmount, o.total, o.paymentMethod,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartpos_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm">
          <p className="text-gray-400 mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color || '#6366f1' }} className="font-medium">
              {p.name}: {p.name === 'revenue' || p.dataKey === 'revenue' ? formatCurrency(p.value) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Comprehensive business insights</p>
        </div>
        <div className="flex gap-3">
          {/* Date Range */}
          <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1">
            {(['7d', '30d', '90d', 'mtd'] as DateRange[]).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateRange === range ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === 'mtd' ? 'This Month' : range}
              </button>
            ))}
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-indigo-500/20 rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-indigo-400 mb-2" />
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-white text-xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-gray-900 border border-green-500/20 rounded-xl p-4">
          <BarChart2 className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-white text-xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4">
          <Users className="w-5 h-5 text-yellow-400 mb-2" />
          <p className="text-gray-500 text-sm">Avg Order Value</p>
          <p className="text-white text-xl font-bold">{formatCurrency(avgOrderValue)}</p>
        </div>
        <div className="bg-gray-900 border border-purple-500/20 rounded-xl p-4">
          <Package className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-gray-500 text-sm">Tax Collected</p>
          <p className="text-white text-xl font-bold">{formatCurrency(totalTax)}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-5">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} name="revenue" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders + Payment Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-5">Daily Orders</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.slice(-14)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} name="orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Payment Methods</h3>
          <div className="space-y-3 mt-4">
            {paymentData.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No data available</p>
            ) : paymentData.map((p: any, i: number) => {
              const total = paymentData.reduce((s: number, x: any) => s + (x.value as number), 0);
              const pct = total > 0 ? ((p.value as number) / total * 100).toFixed(1) : 0;
              const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500'];
              return (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300 text-sm font-medium">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs">{pct}%</span>
                      <span className="text-white text-sm font-semibold">{formatCurrency(p.value as number)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className={`${colors[i % colors.length]} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Best Sellers */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Top Products</h3>
          {bestSellers.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No sales data</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 text-gray-600 text-xs font-bold text-center">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <p className="text-gray-500 text-xs">{item.qty} units sold</p>
                  </div>
                  <span className="text-green-400 text-sm font-semibold">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cashier Performance */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Cashier Performance</h3>
          {cashierData.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No data available</p>
          ) : (
            <div className="space-y-3">
              {cashierData.map((cashier, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold flex-shrink-0">
                    {cashier.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{cashier.name}</p>
                    <p className="text-gray-500 text-xs">{cashier.orders} orders</p>
                  </div>
                  <span className="text-indigo-400 text-sm font-semibold">{formatCurrency(cashier.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discount & Tax Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Financial Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-500 mb-1">Gross Revenue</p>
            <p className="text-white font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-500 mb-1">Discounts Given</p>
            <p className="text-red-400 font-bold">-{formatCurrency(totalDiscount)}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-500 mb-1">GST Collected</p>
            <p className="text-yellow-400 font-bold">{formatCurrency(totalTax)}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-500 mb-1">Net Revenue</p>
            <p className="text-green-400 font-bold">{formatCurrency(totalRevenue - totalTax)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
