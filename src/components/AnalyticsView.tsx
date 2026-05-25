import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Package, ArrowUpRight } from 'lucide-react';
import { Order } from '../types';

interface AnalyticsViewProps {
  orders: Order[];
  products?: any[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl p-3" style={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.3)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#94a3b8' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name}: {p.name === 'Revenue' ? '$' : ''}{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsView({ orders }: AnalyticsViewProps) {
  const completedOrders = orders.filter(o => o.status === 'completed');

  const stats = useMemo(() => {
    const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
    const totalOrders = completedOrders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalProfit = completedOrders.reduce((s, o) => {
      const cost = o.items.reduce((cs, i) => cs + ((i.cost ?? i.price * 0.5) * i.quantity), 0);
      return s + (o.total - cost);
    }, 0);
    return { totalRevenue, totalOrders, avgOrder, totalProfit };
  }, [completedOrders]);

  const weeklySales = useMemo(() => {
    const days: { day: string; Revenue: number; Orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const dayOrders = completedOrders.filter(o => new Date(o.createdAt).toDateString() === dayStr);
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        Revenue: parseFloat(dayOrders.reduce((s, o) => s + o.total, 0).toFixed(2)),
        Orders: dayOrders.length,
      });
    }
    return days;
  }, [completedOrders]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; emoji: string; qty: number; revenue: number }> = {};
    completedOrders.forEach(o => {
      o.items.forEach(item => {
        if (!map[item.name]) map[item.name] = { name: item.name, emoji: item.emoji, qty: 0, revenue: 0 };
        map[item.name].qty += item.quantity;
        map[item.name].revenue += item.price * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [completedOrders]);



  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { cash: 0, card: 0, digital: 0 };
    completedOrders.forEach(o => { map[o.paymentMethod] = (map[o.paymentMethod] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [completedOrders]);

  const statCards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Avg. Order Value', value: `$${stats.avgOrder.toFixed(2)}`, icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Est. Profit', value: `$${stats.totalProfit.toFixed(2)}`, icon: Package, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6" style={{ background: '#0f172a' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>Business performance overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card rounded-2xl p-4" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(51,65,85,0.5)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <ArrowUpRight size={14} style={{ color: '#10b981' }} />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(51,65,85,0.5)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklySales}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(51,65,85,0.5)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Payment Methods</h3>
          {paymentBreakdown.some(p => p.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {paymentBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: '#64748b' }}>No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders Bar Chart */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(51,65,85,0.5)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Daily Orders</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(51,65,85,0.5)' }}>
          <h3 className="text-sm font-bold text-white mb-4">Top Products</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxRev = topProducts[0].revenue;
                const pct = maxRev > 0 ? (p.revenue / maxRev) * 100 : 0;
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{p.emoji}</span>
                        <span className="text-sm font-medium text-white">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold" style={{ color: COLORS[i % COLORS.length] }}>${p.revenue.toFixed(2)}</span>
                        <span className="text-xs ml-2" style={{ color: '#64748b' }}>×{p.qty}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(51,65,85,0.5)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm" style={{ color: '#64748b' }}>Complete orders to see data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
