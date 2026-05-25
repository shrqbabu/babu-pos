import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import type { Order } from "../types";
import { Button, Card, Input, Label, Select, Spinner } from "../components/ui";
import { downloadCSV, fmtDate, fmtDateTime, fmtMoney } from "../lib/helpers";
import { IconDownload } from "../components/icons";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Reports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10));
  const [groupBy, setGroupBy] = useState<"day"|"product"|"cashier">("day");

  useEffect(() => {
    const u = onSnapshot(query(collection(db,"orders"), orderBy("createdAt","desc")), (s) => {
      setOrders(s.docs.map(d => ({id:d.id,...(d.data() as any)})));
      setLoading(false);
    });
    return u;
  }, []);

  const filtered = useMemo(() => {
    const fromTs = new Date(from).getTime();
    const toTs = new Date(to).getTime() + 86400000;
    return orders.filter(o => o.createdAt >= fromTs && o.createdAt < toTs);
  }, [orders, from, to]);

  const totals = useMemo(() => ({
    revenue: filtered.reduce((s,o)=>s+o.total,0),
    orders: filtered.length,
    avg: filtered.length ? filtered.reduce((s,o)=>s+o.total,0)/filtered.length : 0,
    tax: filtered.reduce((s,o)=>s+(o.tax||0),0),
  }), [filtered]);

  const grouped = useMemo(() => {
    if (groupBy === "day") {
      const map = new Map<string,{label:string;revenue:number;orders:number}>();
      filtered.forEach(o => {
        const k = fmtDate(o.createdAt);
        const cur = map.get(k) || { label:k, revenue:0, orders:0 };
        cur.revenue += o.total; cur.orders += 1; map.set(k, cur);
      });
      return Array.from(map.values()).sort((a,b)=>new Date(a.label).getTime()-new Date(b.label).getTime());
    }
    if (groupBy === "product") {
      const map = new Map<string,{label:string;revenue:number;orders:number}>();
      filtered.forEach(o => o.items?.forEach(it => {
        const cur = map.get(it.productId) || { label:it.name, revenue:0, orders:0 };
        cur.revenue += it.price*it.qty; cur.orders += it.qty; map.set(it.productId, cur);
      }));
      return Array.from(map.values()).sort((a,b) => b.revenue-a.revenue).slice(0,20);
    }
    const map = new Map<string,{label:string;revenue:number;orders:number}>();
    filtered.forEach(o => {
      const cur = map.get(o.cashierId) || { label:o.cashierName, revenue:0, orders:0 };
      cur.revenue += o.total; cur.orders += 1; map.set(o.cashierId, cur);
    });
    return Array.from(map.values()).sort((a,b) => b.revenue-a.revenue);
  }, [filtered, groupBy]);

  const exportCSV = () => {
    const rows: (string|number)[][] = [
      ["Invoice No","Date","Customer","Cashier","Items","Subtotal","Discount","Tax","Total","Payment"],
      ...filtered.map(o => [o.orderNo, fmtDateTime(o.createdAt), o.customerName||"Walk-in", o.cashierName, o.items?.length||0, o.subtotal, o.discount, o.tax, o.total, o.payment])
    ];
    downloadCSV(`sales_${from}_to_${to}.csv`, rows);
  };

  const exportPDF = () => {
    // Simple PDF via print → save as PDF
    const w = window.open("", "_blank");
    if (!w) return;
    const rowsHtml = filtered.map(o => `
      <tr>
        <td>${o.orderNo}</td><td>${fmtDateTime(o.createdAt)}</td><td>${o.customerName||"Walk-in"}</td>
        <td>${o.cashierName}</td><td style="text-align:right">${fmtMoney(o.total)}</td><td>${o.payment.toUpperCase()}</td>
      </tr>`).join("");
    w.document.write(`
      <html><head><title>Sales Report</title>
      <style>body{font-family:system-ui;padding:24px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}h1{margin:0 0 8px}</style>
      </head><body>
        <h1>SmartPOS Sales Report</h1>
        <p style="color:#666">${from} → ${to} · ${filtered.length} orders · ${fmtMoney(totals.revenue)} total revenue</p>
        <table><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Cashier</th><th style="text-align:right">Total</th><th>Pay</th></tr></thead><tbody>${rowsHtml}</tbody></table>
        <script>window.print();</script>
      </body></html>`);
    w.document.close();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  return (
    <div className="space-y-4 animate-fadeIn">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div><Label>Group By</Label>
            <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
              <option value="day">Day</option><option value="product">Product</option><option value="cashier">Cashier</option>
            </Select>
          </div>
          <div className="flex-1"/>
          <Button variant="outline" onClick={exportCSV}><IconDownload className="h-4 w-4"/> CSV</Button>
          <Button onClick={exportPDF}><IconDownload className="h-4 w-4"/> PDF</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l:"Total Revenue", v:fmtMoney(totals.revenue) },
          { l:"Total Orders", v:totals.orders },
          { l:"Avg Order Value", v:fmtMoney(totals.avg) },
          { l:"Total Tax", v:fmtMoney(totals.tax) },
        ].map(s => (
          <Card key={s.l} className="p-4">
            <div className="text-xs text-slate-500 uppercase">{s.l}</div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{s.v}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 capitalize">Revenue by {groupBy}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grouped}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.2)" vertical={false}/>
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}/>
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{ background:"#0f172a", border:"none", borderRadius:8, color:"white" }} formatter={(v:any) => fmtMoney(Number(v))}/>
              <Bar dataKey="revenue" fill="#6366f1" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-3">{groupBy === "day" ? "Date" : groupBy === "product" ? "Product" : "Cashier"}</th>
              <th className="px-4 py-3 text-right">Orders/Qty</th><th className="px-4 py-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {grouped.map((g,i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium">{g.label}</td>
                <td className="px-4 py-3 text-right">{g.orders}</td>
                <td className="px-4 py-3 text-right font-bold">{fmtMoney(g.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </div>
  );
}
