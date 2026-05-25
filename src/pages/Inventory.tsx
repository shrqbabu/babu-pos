import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, increment, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../contexts/ToastContext";
import type { Product, PurchaseEntry, Supplier } from "../types";
import { Badge, Button, Card, EmptyState, Input, Label, Modal, Select, Spinner } from "../components/ui";
import { fmtDateTime, fmtMoney } from "../lib/helpers";
import { IconPlus, IconTrash } from "../components/icons";

export default function Inventory() {
  const { push } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"alerts"|"history"|"suppliers"|"purchase">("alerts");
  const [supplierModal, setSupplierModal] = useState(false);
  const [supForm, setSupForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [purForm, setPurForm] = useState({ productId: "", supplierId: "", qty: 0, cost: 0 });

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "products"), s => { setProducts(s.docs.map(d => ({id:d.id,...(d.data() as any)}))); setLoading(false); });
    const u2 = onSnapshot(collection(db, "suppliers"), s => setSuppliers(s.docs.map(d => ({id:d.id,...(d.data() as any)}))));
    const u3 = onSnapshot(query(collection(db, "inventory"), orderBy("createdAt","desc")), s => setHistory(s.docs.slice(0,50).map(d => ({id:d.id,...(d.data() as any)}))));
    const u4 = onSnapshot(query(collection(db, "purchases"), orderBy("createdAt","desc")), s => setPurchases(s.docs.map(d => ({id:d.id,...(d.data() as any)}))));
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const lowStock = useMemo(() => products.filter(p => p.stock <= (p.lowStockAt ?? 5)).sort((a,b) => a.stock-b.stock), [products]);

  const saveSupplier = async () => {
    if (!supForm.name) { push("Name required", "error"); return; }
    await addDoc(collection(db, "suppliers"), supForm);
    setSupForm({ name:"", phone:"", email:"", notes:"" }); setSupplierModal(false); push("Supplier added", "success");
  };

  const savePurchase = async () => {
    const p = products.find(x => x.id === purForm.productId);
    if (!p || purForm.qty <= 0) { push("Select product & qty", "error"); return; }
    const sup = suppliers.find(s => s.id === purForm.supplierId);
    await addDoc(collection(db, "purchases"), {
      productId: p.id, productName: p.name, supplierId: sup?.id || null, supplierName: sup?.name || "",
      qty: purForm.qty, cost: purForm.cost, createdAt: Date.now(),
    });
    await updateDoc(doc(db, "products", p.id), { stock: increment(purForm.qty), status: "in_stock" });
    await addDoc(collection(db, "inventory"), {
      productId: p.id, productName: p.name, type: "purchase", change: purForm.qty, createdAt: Date.now(),
    });
    setPurchaseModal(false); setPurForm({ productId:"", supplierId:"", qty:0, cost:0 }); push("Stock added", "success");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  return (
    <div className="space-y-4 animate-fadeIn">
      <Card className="p-2 flex gap-1 overflow-x-auto">
        {([
          { k:"alerts", l:`Restock Alerts (${lowStock.length})` },
          { k:"history", l:"Inventory History" },
          { k:"purchase", l:"Purchase Entries" },
          { k:"suppliers", l:"Suppliers" },
        ] as const).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 h-9 rounded-lg text-sm font-medium whitespace-nowrap ${tab===t.k?"bg-indigo-600 text-white":"text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
            {t.l}
          </button>
        ))}
        <div className="flex-1"/>
        {tab==="suppliers" && <Button onClick={() => setSupplierModal(true)}><IconPlus className="h-4 w-4"/>Supplier</Button>}
        {tab==="purchase" && <Button onClick={() => setPurchaseModal(true)}><IconPlus className="h-4 w-4"/>Purchase</Button>}
      </Card>

      {tab === "alerts" && (
        <Card className="overflow-hidden">
          {lowStock.length === 0 ? <EmptyState title="All products are well stocked" desc="No restock alerts right now." /> :
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Current Stock</th><th className="px-4 py-3 text-right">Alert At</th><th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lowStock.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                      <td className="px-4 py-3 text-slate-600">{p.category}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">{p.stock}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{p.lowStockAt ?? 5}</td>
                      <td className="px-4 py-3">{p.stock<=0?<Badge variant="danger">Out of Stock</Badge>:<Badge variant="warn">Low Stock</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </Card>
      )}

      {tab === "history" && (
        <Card className="overflow-hidden">
          {history.length === 0 ? <EmptyState title="No history" desc="Stock movements appear here." /> :
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Date</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Change</th><th className="px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{fmtDateTime(h.createdAt)}</td>
                    <td className="px-4 py-3 font-medium">{h.productName}</td>
                    <td className="px-4 py-3"><Badge variant={h.type==="sale"?"info":"success"}>{h.type}</Badge></td>
                    <td className={`px-4 py-3 text-right font-bold ${h.change>0?"text-emerald-600":"text-rose-600"}`}>{h.change>0?`+${h.change}`:h.change}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{h.orderNo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          }
        </Card>
      )}

      {tab === "purchase" && (
        <Card className="overflow-hidden">
          {purchases.length === 0 ? <EmptyState title="No purchases" desc="Record purchase entries to restock inventory." /> :
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Date</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">{fmtDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3 font-medium">{p.productName}</td>
                    <td className="px-4 py-3 text-slate-600">{p.supplierName || "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">+{p.qty}</td>
                    <td className="px-4 py-3 text-right">{fmtMoney(p.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          }
        </Card>
      )}

      {tab === "suppliers" && (
        <Card className="overflow-hidden">
          {suppliers.length === 0 ? <EmptyState title="No suppliers" desc="Add suppliers to track purchases." /> :
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {suppliers.map(s => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.phone} {s.email && `• ${s.email}`}</div>
                  </div>
                  <button onClick={() => deleteDoc(doc(db,"suppliers",s.id))} className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center"><IconTrash className="h-4 w-4"/></button>
                </div>
              ))}
            </div>
          }
        </Card>
      )}

      <Modal open={supplierModal} onClose={() => setSupplierModal(false)} title="Add Supplier">
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={supForm.name} onChange={(e) => setSupForm({...supForm, name:e.target.value})} /></div>
          <div><Label>Phone</Label><Input value={supForm.phone} onChange={(e) => setSupForm({...supForm, phone:e.target.value})} /></div>
          <div><Label>Email</Label><Input type="email" value={supForm.email} onChange={(e) => setSupForm({...supForm, email:e.target.value})} /></div>
          <div><Label>Notes</Label><Input value={supForm.notes} onChange={(e) => setSupForm({...supForm, notes:e.target.value})} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSupplierModal(false)}>Cancel</Button><Button onClick={saveSupplier}>Add</Button></div>
        </div>
      </Modal>

      <Modal open={purchaseModal} onClose={() => setPurchaseModal(false)} title="Record Purchase">
        <div className="space-y-3">
          <div><Label>Product</Label>
            <Select value={purForm.productId} onChange={(e) => setPurForm({...purForm, productId:e.target.value})}>
              <option value="">Select product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock {p.stock})</option>)}
            </Select>
          </div>
          <div><Label>Supplier</Label>
            <Select value={purForm.supplierId} onChange={(e) => setPurForm({...purForm, supplierId:e.target.value})}>
              <option value="">— None —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantity</Label><Input type="number" min={1} value={purForm.qty} onChange={(e) => setPurForm({...purForm, qty:+e.target.value})} /></div>
            <div><Label>Total Cost (₹)</Label><Input type="number" min={0} value={purForm.cost} onChange={(e) => setPurForm({...purForm, cost:+e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPurchaseModal(false)}>Cancel</Button><Button onClick={savePurchase}>Save & Update Stock</Button></div>
        </div>
      </Modal>
    </div>
  );
}
