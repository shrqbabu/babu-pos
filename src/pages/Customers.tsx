import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../contexts/ToastContext";
import type { Customer, Order } from "../types";
import { Badge, Button, Card, EmptyState, Input, Label, Modal, Spinner } from "../components/ui";
import { fmtDate, fmtMoney } from "../lib/helpers";
import { IconEdit, IconPlus, IconSearch, IconTrash } from "../components/icons";

export default function Customers() {
  const { push } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [history, setHistory] = useState<Order[] | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    const u = onSnapshot(collection(db, "customers"), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    });
    return u;
  }, []);

  const filtered = useMemo(() => customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  ).sort((a,b) => (b.createdAt||0) - (a.createdAt||0)), [customers, search]);

  const open = (c?: Customer) => {
    if (c) { setEditing(c); setForm({ name: c.name, phone: c.phone, email: c.email || "" }); }
    else { setEditing(null); setForm({ name: "", phone: "", email: "" }); }
    setModal(true);
  };

  const save = async () => {
    if (!form.name || !form.phone) { push("Name & phone required", "error"); return; }
    if (editing) {
      await updateDoc(doc(db, "customers", editing.id), form as any);
      push("Customer updated", "success");
    } else {
      await addDoc(collection(db, "customers"), { ...form, loyaltyPoints: 0, totalSpent: 0, visits: 0, createdAt: Date.now() });
      push("Customer added", "success");
    }
    setModal(false);
  };

  const remove = async (c: Customer) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    await deleteDoc(doc(db, "customers", c.id));
    push("Customer deleted", "success");
  };

  const viewHistory = async (c: Customer) => {
    setSelected(c); setHistory(null);
    const snap = await import("firebase/firestore").then(m =>
      m.getDocs(query(collection(db, "orders"), where("customerId", "==", c.id), orderBy("createdAt", "desc")))
    );
    setHistory(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  return (
    <div className="space-y-4 animate-fadeIn">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <IconSearch className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…" className="pl-9" />
          </div>
          <Button onClick={() => open()}><IconPlus className="h-4 w-4"/> Add Customer</Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? <EmptyState title="No customers" desc="Start building your customer base." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Visits</th><th className="px-4 py-3 text-right">Total Spent</th>
                  <th className="px-4 py-3 text-center">Loyalty</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-xs font-bold flex items-center justify-center">{c.name?.[0]?.toUpperCase() || "?"}</div>
                        <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.phone}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-center">{c.visits || 0}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtMoney(c.totalSpent || 0)}</td>
                    <td className="px-4 py-3 text-center"><Badge variant="info">{c.loyaltyPoints || 0} pts</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => viewHistory(c)} className="text-xs text-indigo-600 hover:underline px-2">History</button>
                        <button onClick={() => open(c)} className="h-8 w-8 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 flex items-center justify-center"><IconEdit className="h-4 w-4"/></button>
                        <button onClick={() => remove(c)} className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 flex items-center justify-center"><IconTrash className="h-4 w-4"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Customer" : "Add Customer"}>
        <div className="space-y-3">
          <div><Label>Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Phone Number</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Email (optional)</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Add"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Purchase History — ${selected?.name}`} size="lg">
        {!history ? <div className="flex justify-center py-8"><Spinner/></div> :
          history.length === 0 ? <EmptyState title="No purchases yet" desc="This customer hasn't placed any orders." /> :
          <div className="space-y-2">
            {history.map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-mono text-xs font-semibold text-indigo-600">{o.orderNo}</div>
                  <div className="text-xs text-slate-500">{fmtDate(o.createdAt)} • {o.items?.length || 0} items</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-white">{fmtMoney(o.total)}</div>
                  <Badge variant="info">{(o.payment || "—").toUpperCase()}</Badge>
                </div>
              </div>
            ))}
          </div>
        }
      </Modal>
    </div>
  );
}
