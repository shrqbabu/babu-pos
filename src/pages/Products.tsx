import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useToast } from "../contexts/ToastContext";
import type { Category, Product } from "../types";
import { Button, Card, Input, Label, Modal, Select, Badge, EmptyState, Spinner } from "../components/ui";
import { IconPlus, IconEdit, IconTrash, IconSearch, IconBarcode } from "../components/icons";
import { fmtMoney } from "../lib/helpers";

const blank: Omit<Product, "id"> = {
  name: "", category: "", price: 0, cost: 0, stock: 0, barcode: "", image: "",
  lowStockAt: 5, status: "in_stock", createdAt: Date.now(),
};

export default function Products() {
  const { push } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(blank);
  const [saving, setSaving] = useState(false);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [catModal, setCatModal] = useState(false);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    });
    const u2 = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => { u1(); u2(); };
  }, []);

  const filtered = useMemo(() => products.filter(p => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.barcode || "").includes(search);
  }), [products, search, filterCat]);

  const open = (p?: Product) => {
    if (p) { setEditing(p); setForm(p); }
    else { setEditing(null); setForm({ ...blank, createdAt: Date.now() }); }
    setImgFile(null);
    setModal(true);
  };

  const save = async () => {
    if (!form.name || form.price <= 0) { push("Name & valid price required", "error"); return; }
    setSaving(true);
    try {
      let image = form.image || "";
      if (imgFile) {
        const r = sref(storage, `products/${Date.now()}_${imgFile.name}`);
        const snap = await uploadBytes(r, imgFile);
        image = await getDownloadURL(snap.ref);
      }
      const payload = {
        ...form, image,
        status: form.stock > 0 ? ("in_stock" as const) : ("out_of_stock" as const),
      };
      if (editing) {
        await updateDoc(doc(db, "products", editing.id), payload as any);
        push("Product updated", "success");
      } else {
        await addDoc(collection(db, "products"), payload);
        push("Product added", "success");
      }
      setModal(false);
    } catch (e: any) {
      console.error(e); push(e?.message || "Save failed", "error");
    } finally { setSaving(false); }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await deleteDoc(doc(db, "products", p.id));
    push("Product deleted", "success");
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await addDoc(collection(db, "categories"), { name: newCat.trim() });
    setNewCat(""); push("Category added", "success");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  return (
    <div className="space-y-4 animate-fadeIn">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <IconSearch className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or barcode…" className="pl-9" />
          </div>
          <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="max-w-[180px]">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
          <Button variant="outline" onClick={() => setCatModal(true)}>Manage Categories</Button>
          <Button onClick={() => open()}><IconPlus className="h-4 w-4"/> Add Product</Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="No products" desc="Add your first product to start selling." action={<Button onClick={() => open()}><IconPlus className="h-4 w-4"/> Add Product</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(p => {
                  const low = p.stock <= (p.lowStockAt ?? 5);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                            {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-slate-400">{p.name?.[0]?.toUpperCase() || "?"}</span>}
                          </div>
                          <div className="font-medium text-slate-900 dark:text-white">{p.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.category || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">{p.barcode || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">{fmtMoney(p.price)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={low ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-700 dark:text-slate-300"}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        {p.stock <= 0 ? <Badge variant="danger">Out of Stock</Badge> :
                          low ? <Badge variant="warn">Low Stock</Badge> : <Badge variant="success">In Stock</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => open(p)} className="h-8 w-8 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                            <IconEdit className="h-4 w-4"/>
                          </button>
                          <button onClick={() => remove(p)} className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 flex items-center justify-center">
                            <IconTrash className="h-4 w-4"/>
                          </button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Product" : "Add Product"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><Label>Product Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Barcode</Label>
            <div className="relative">
              <IconBarcode className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9 font-mono" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Optional"/>
            </div>
          </div>
          <div><Label>Selling Price (₹)</Label><Input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
          <div><Label>Cost Price (₹)</Label><Input type="number" min={0} step={0.01} value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} /></div>
          <div><Label>Stock Quantity</Label><Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
          <div><Label>Low Stock Alert At</Label><Input type="number" min={0} value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: +e.target.value })} /></div>
          <div className="sm:col-span-2">
            <Label>Product Image</Label>
            <input type="file" accept="image/*" onChange={(e) => setImgFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 dark:file:bg-indigo-500/10 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100"/>
            {form.image && !imgFile && <img src={form.image} className="h-20 w-20 mt-2 rounded-lg object-cover"/>}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={save} loading={saving}>{editing ? "Update" : "Add"} Product</Button>
        </div>
      </Modal>

      <Modal open={catModal} onClose={() => setCatModal(false)} title="Manage Categories">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <Button onClick={addCategory}>Add</Button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {categories.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">No categories yet.</p> :
              categories.map(c => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</span>
                  <button onClick={async () => { await deleteDoc(doc(db, "categories", c.id)); push("Removed", "success"); }}
                    className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 h-7 w-7 rounded-lg flex items-center justify-center">
                    <IconTrash className="h-3.5 w-3.5"/>
                  </button>
                </div>
              ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
