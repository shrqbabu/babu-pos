import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { ActivityLog, AppUser, Order } from "../types";
import { Badge, Button, Card, EmptyState, Input, Label, Modal, Select, Spinner } from "../components/ui";
import { fmtDateTime, fmtMoney } from "../lib/helpers";
import { IconEdit, IconPlus, IconTrash } from "../components/icons";

export default function Employees() {
  const { register } = useAuth();
  const { push } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cashier" as "admin"|"cashier" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...(d.data() as any) })));
      setLoading(false);
    });
    const u2 = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    const u3 = onSnapshot(query(collection(db, "activity_logs"), orderBy("createdAt", "desc")), (snap) => {
      setLogs(snap.docs.slice(0,30).map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => { u1(); u2(); u3(); };
  }, []);

  const performance = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; revenue: number }>();
    orders.forEach(o => {
      const cur = map.get(o.cashierId) || { name: o.cashierName, orders: 0, revenue: 0 };
      cur.orders += 1; cur.revenue += o.total;
      map.set(o.cashierId, cur);
    });
    return map;
  }, [orders]);

  const open = (u?: AppUser) => {
    if (u) { setEditing(u); setForm({ name: u.name, email: u.email, password: "", role: u.role }); }
    else { setEditing(null); setForm({ name: "", email: "", password: "", role: "cashier" }); }
    setModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, "users", editing.uid), { name: form.name, role: form.role });
        push("Employee updated", "success");
      } else {
        if (!form.email || !form.password) { push("Email & password required", "error"); setSaving(false); return; }
        await register(form.email, form.password, form.name, form.role);
        push("Employee created", "success");
      }
      setModal(false);
    } catch (e: any) {
      push(e?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  const remove = async (u: AppUser) => {
    if (!confirm(`Delete employee profile "${u.name}"? (Auth account remains.)`)) return;
    await deleteDoc(doc(db, "users", u.uid));
    push("Employee profile removed", "success");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  return (
    <div className="space-y-4 animate-fadeIn">
      <Card className="p-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Team & Roles</h3>
          <p className="text-xs text-slate-500 mt-0.5">{users.length} member{users.length!==1&&"s"}</p>
        </div>
        <Button onClick={() => open()}><IconPlus className="h-4 w-4"/> Add Employee</Button>
      </Card>

      <Card className="overflow-hidden">
        {users.length === 0 ? <EmptyState title="No employees" desc="Add your first staff member." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-center">Orders</th><th className="px-4 py-3 text-right">Revenue</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => {
                  const perf = performance.get(u.uid);
                  return (
                    <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-bold flex items-center justify-center">{u.name?.[0]?.toUpperCase()}</div>
                          <span className="font-medium text-slate-900 dark:text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="px-4 py-3"><Badge variant={u.role==="admin"?"danger":"info"}>{u.role}</Badge></td>
                      <td className="px-4 py-3 text-center">{perf?.orders || 0}</td>
                      <td className="px-4 py-3 text-right font-semibold">{fmtMoney(perf?.revenue || 0)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => open(u)} className="h-8 w-8 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 flex items-center justify-center"><IconEdit className="h-4 w-4"/></button>
                          <button onClick={() => remove(u)} className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 flex items-center justify-center"><IconTrash className="h-4 w-4"/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Activity Logs</h3>
        {logs.length === 0 ? <p className="text-sm text-slate-500 text-center py-6">No activity yet.</p> :
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {logs.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="h-2 w-2 rounded-full bg-emerald-500"/>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{l.userName}</span>{" "}
                  <span className="text-sm text-slate-600 dark:text-slate-400">{l.action.replace(/_/g," ")}</span>
                  {l.meta && <span className="text-xs text-slate-500 ml-1">— {l.meta}</span>}
                </div>
                <div className="text-xs text-slate-400">{fmtDateTime(l.createdAt)}</div>
              </div>
            ))}
          </div>
        }
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Employee" : "Add Employee"}>
        <div className="space-y-3">
          <div><Label>Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} disabled={!!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          {!editing && <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>}
          <div><Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
              <option value="cashier">Cashier</option><option value="admin">Admin</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
