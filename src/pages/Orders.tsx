import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import type { Order } from "../types";
import { Badge, Card, EmptyState, Input, Modal, Select, Spinner } from "../components/ui";
import { fmtDateTime, fmtMoney } from "../lib/helpers";
import { IconSearch } from "../components/icons";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    const u = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    });
    return u;
  }, []);

  const filtered = useMemo(() => orders.filter(o => {
    if (payFilter !== "all" && o.payment !== payFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return o.orderNo.toLowerCase().includes(q) || (o.customerName || "").toLowerCase().includes(q) || o.cashierName.toLowerCase().includes(q);
  }), [orders, search, payFilter]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  return (
    <div className="space-y-4 animate-fadeIn">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <IconSearch className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…" className="pl-9" />
          </div>
          <Select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} className="max-w-[180px]">
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? <EmptyState title="No orders" desc="Completed orders will appear here." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice #</th><th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th><th className="px-4 py-3">Cashier</th>
                  <th className="px-4 py-3 text-center">Items</th><th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(o => (
                  <tr key={o.id} onClick={() => setSelected(o)} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{o.orderNo}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{fmtDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white">{o.customerName || "Walk-in"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{o.cashierName}</td>
                    <td className="px-4 py-3 text-center">{o.items?.length || 0}</td>
                    <td className="px-4 py-3"><Badge variant={o.payment==="cash"?"success":o.payment==="upi"?"info":"warn"}>{(o.payment || "—").toUpperCase()}</Badge></td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{fmtMoney(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Order Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-xs text-slate-500">Invoice</div><div className="font-mono font-semibold">{selected.orderNo}</div></div>
              <div><div className="text-xs text-slate-500">Date</div><div>{fmtDateTime(selected.createdAt)}</div></div>
              <div><div className="text-xs text-slate-500">Customer</div><div>{selected.customerName || "Walk-in"}</div></div>
              <div><div className="text-xs text-slate-500">Cashier</div><div>{selected.cashierName}</div></div>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="text-left text-xs text-slate-500"><th className="px-3 py-2">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selected.items || []).map((it, i) => (
                    <tr key={i}><td className="px-3 py-2">{it.name}</td><td className="px-3 py-2 text-right">{it.qty}</td><td className="px-3 py-2 text-right">{fmtMoney(it.price)}</td><td className="px-3 py-2 text-right font-semibold">{fmtMoney(it.price*it.qty)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Subtotal</span><span>{fmtMoney(selected.subtotal)}</span></div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Discount</span><span className="text-rose-500">-{fmtMoney(selected.discount)}</span></div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Tax</span><span>{fmtMoney(selected.tax)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 dark:border-slate-800"><span>Total</span><span>{fmtMoney(selected.total)}</span></div>
              <div className="flex justify-between pt-2"><span className="text-slate-500">Payment</span><Badge variant="info">{(selected.payment || "—").toUpperCase()}</Badge></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
