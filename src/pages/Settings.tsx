import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, Input, Label, Select } from "../components/ui";
import { downloadCSV } from "../lib/helpers";

interface Settings {
  storeName: string; address: string; phone: string; gstin: string;
  currency: string; defaultTax: number; receiptFooter: string; multiStore: boolean;
}
const defaults: Settings = {
  storeName: "SmartPOS Store", address: "", phone: "", gstin: "",
  currency: "₹", defaultTax: 5, receiptFooter: "Thank you for shopping with us!", multiStore: false,
};

export default function SettingsPage() {
  const { profile } = useAuth();
  const { theme, toggle } = useTheme();
  const { push } = useToast();
  const [s, setS] = useState<Settings>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "settings", "store"));
      if (snap.exists()) setS({ ...defaults, ...(snap.data() as any) });
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "store"), s, { merge: true });
      push("Settings saved", "success");
    } catch (e: any) { push(e?.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  const backup = async () => {
    const collections = ["products","customers","orders","categories","suppliers","purchases","users"];
    const data: Record<string, any[]> = {};
    for (const c of collections) {
      const snap = await getDocs(collection(db, c));
      data[c] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `smartpos_backup_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    push("Backup downloaded", "success");
  };

  const exportProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    const rows: (string|number)[][] = [["ID","Name","Category","Price","Cost","Stock","Barcode","Status"]];
    snap.docs.forEach(d => {
      const p: any = d.data();
      rows.push([d.id, p.name, p.category, p.price, p.cost||0, p.stock, p.barcode||"", p.status||""]);
    });
    downloadCSV("products.csv", rows);
  };

  return (
    <div className="space-y-4 animate-fadeIn max-w-3xl">
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Store Information</h3>
        <p className="text-xs text-slate-500 mb-4">Used on receipts and invoices.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><Label>Store Name</Label><Input value={s.storeName} onChange={(e) => setS({...s, storeName:e.target.value})} /></div>
          <div className="sm:col-span-2"><Label>Address</Label><Input value={s.address} onChange={(e) => setS({...s, address:e.target.value})} /></div>
          <div><Label>Phone</Label><Input value={s.phone} onChange={(e) => setS({...s, phone:e.target.value})} /></div>
          <div><Label>GSTIN</Label><Input value={s.gstin} onChange={(e) => setS({...s, gstin:e.target.value})} /></div>
          <div><Label>Currency Symbol</Label><Input value={s.currency} onChange={(e) => setS({...s, currency:e.target.value})} /></div>
          <div><Label>Default Tax %</Label><Input type="number" value={s.defaultTax} onChange={(e) => setS({...s, defaultTax:+e.target.value})} /></div>
          <div className="sm:col-span-2"><Label>Receipt Footer</Label><Input value={s.receiptFooter} onChange={(e) => setS({...s, receiptFooter:e.target.value})} /></div>
          <div className="sm:col-span-2">
            <Label>Multi-Store Mode</Label>
            <Select value={s.multiStore?"on":"off"} onChange={(e) => setS({...s, multiStore: e.target.value === "on"})}>
              <option value="off">Single Store</option><option value="on">Multi-Store (Beta)</option>
            </Select>
          </div>
        </div>
        <div className="flex justify-end mt-5"><Button onClick={save} loading={saving}>Save Settings</Button></div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Appearance</h3>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Theme</div>
            <div className="text-xs text-slate-500">Currently {theme} mode</div>
          </div>
          <Button variant="outline" onClick={toggle}>Toggle Theme</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Data Management</h3>
        <div className="space-y-2">
          <Button variant="outline" onClick={backup} className="w-full justify-start">Download Full Backup (JSON)</Button>
          <Button variant="outline" onClick={exportProducts} className="w-full justify-start">Export Products (CSV)</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Account</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium">{profile?.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium">{profile?.email}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="font-medium capitalize">{profile?.role}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">UID</span><span className="font-mono text-xs">{profile?.uid?.slice(0,12)}…</span></div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Keyboard Shortcuts (POS)</h3>
        <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
          <li><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">F2</kbd> — Focus product search</li>
          <li><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">F4</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">F5</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">F6</kbd> — Cash / Card / UPI</li>
          <li><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">F9</kbd> — Complete sale</li>
          <li><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">Esc</kbd> — Clear cart</li>
          <li><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">Enter</kbd> in search — Add first match / scanned barcode</li>
        </ul>
      </Card>
    </div>
  );
}
