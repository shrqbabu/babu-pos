import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import type { Order, Product } from "../types";
import { Card, Spinner, Badge } from "../components/ui";
import { fmtMoney, fmtDateTime, startOfDay, startOfMonth, startOfWeek } from "../lib/helpers";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, LineChart, PieChart, Pie, Cell,
} from "recharts";

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    });
    const u2 = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => { u1(); u2(); };
  }, []);

  const stats = useMemo(() => {
    const today = startOfDay(), week = startOfWeek(), month = startOfMonth();
    const todayOrders = orders.filter(o => o.createdAt >= today);
    const weekOrders = orders.filter(o => o.createdAt >= week);
    const monthOrders = orders.filter(o => o.createdAt >= month);
    const sum = (arr: Order[]) => arr.reduce((s, o) => s + (o.total || 0), 0);
    return {
      todayRev: sum(todayOrders), todayCount: todayOrders.length,
      weekRev: sum(weekOrders), weekCount: weekOrders.length,
      monthRev: sum(monthOrders), monthCount: monthOrders.length,
      total: orders.length, totalRev: sum(orders),
      lowStock: products.filter(p => p.stock <= (p.lowStockAt ?? 5)).length,
    };
  }, [orders, products]);

  // last 7 days bar chart data
  const chartData = useMemo(() => {
    const days: { label: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      const next = d.getTime() + 86400000;
      const slice = orders.filter(o => o.createdAt >= d.getTime() && o.createdAt < next);
      days.push({
        label: d.toLocaleDateString("en", { weekday: "short" }),
        revenue: slice.reduce((s, o) => s + o.total, 0),
        orders: slice.length,
      });
    }
    return days;
  }, [orders]);

  // best sellers
  const bestSellers = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    orders.forEach(o => (o.items || []).forEach(it => {
      if (!it?.productId) return;
      const cur = map.get(it.productId) || { name: it.name || "Unknown", qty: 0, revenue: 0 };
      cur.qty += (it.qty || 0);
      cur.revenue += (it.qty || 0) * (it.price || 0);
      map.set(it.productId, cur);
    }));
    return Array.from(map.values()).sort((a,b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  // payment split
  const paymentSplit = useMemo(() => {
    const map: Record<string, number> = { cash: 0, upi: 0, card: 0 };
    orders.forEach(o => {
      const k = o.payment || "cash";
      map[k] = (map[k] || 0) + (o.total || 0);
    });
    return [
      { name: "Cash", value: map.cash, color: "#10b981" },
      { name: "UPI", value: map.upi, color: "#6366f1" },
      { name: "Card", value: map.card, color: "#f59e0b" },
    ];
  }, [orders]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  const statCards = [
    { label: "Today's Sales", value: fmtMoney(stats.todayRev), sub: `${stats.todayCount} orders`, color: "from-indigo-500 to-violet-600" },
    { label: "Weekly Sales", value: fmtMoney(stats.weekRev), sub: `${stats.weekCount} orders`, color: "from-emerald-500 to-teal-600" },
    { label: "Monthly Revenue", value: fmtMoney(stats.monthRev), sub: `${stats.monthCount} orders`, color: "from-amber-500 to-orange-600" },
    { label: "Total Orders", value: stats.total, sub: fmtMoney(stats.totalRev) + " lifetime", color: "from-rose-500 to-pink-600" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {stats.lowStock > 0 && (
        <Card className="p-4 border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-amber-500"/>
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <strong>{stats.lowStock}</strong> product{stats.lowStock>1?"s":""} running low on stock. Visit Inventory to restock.
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-5 relative overflow-hidden">
            <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${s.color} opacity-20 blur-2xl`}/>
            <div className="relative">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">{s.label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
              <div className="mt-1 text-xs text-slate-500">{s.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Revenue · Last 7 Days</h3>
            <Badge variant="info">Live</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.2)" vertical={false}/>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false}/>
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "none", borderRadius: 8, color: "white" }}
                  formatter={(v: any) => fmtMoney(Number(v))}
                />
                <Bar dataKey="revenue" fill="url(#g1)" radius={[8,8,0,0]} />
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Payment Methods</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentSplit} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {paymentSplit.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmtMoney(Number(v))} contentStyle={{ background: "#0f172a", border: "none", borderRadius: 8, color: "white" }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {paymentSplit.map(p => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }}/>
                  <span className="text-slate-600 dark:text-slate-400">{p.name}</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{fmtMoney(p.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Best Sellers</h3>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No sales yet.</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                    {i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{b.name}</div>
                    <div className="text-xs text-slate-500">{b.qty} sold</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{fmtMoney(b.revenue)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Transactions</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 6).map(o => (
                <div key={o.id} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                    {(o.payment || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{o.orderNo}</div>
                    <div className="text-xs text-slate-500">{fmtDateTime(o.createdAt)} • {o.cashierName}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{fmtMoney(o.total)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Trend line at bottom */}
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Order Volume Trend</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.2)" vertical={false}/>
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false}/>
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: 8, color: "white" }}/>
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
