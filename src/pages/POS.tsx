import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection, onSnapshot, addDoc, doc, runTransaction, updateDoc, increment, query, where, getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { CartItem, Customer, PaymentMethod, Product } from "../types";
import { Button, Card, Input, Modal, Label, Badge, EmptyState } from "../components/ui";
import { IconSearch, IconPlus, IconMinus, IconTrash, IconCash, IconCard, IconUPI, IconPrint, IconBarcode } from "../components/icons";
import { fmtMoney, fmtDateTime, generateOrderNo } from "../lib/helpers";

export default function POS() {
  const { profile } = useAuth();
  const { push } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0); // percentage
  const [taxRate, setTaxRate] = useState(5);   // GST percentage
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showCustomer, setShowCustomer] = useState(false);
  const [custQuery, setCustQuery] = useState("");
  const [newCust, setNewCust] = useState({ name: "", phone: "" });
  const [completed, setCompleted] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    const u2 = onSnapshot(collection(db, "customers"), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => { u1(); u2(); };
  }, []);

  // Keyboard shortcuts: F2 search, F4 cash, F5 card, F6 upi, F9 checkout, Esc clear
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === "F4") { e.preventDefault(); setPayment("cash"); }
      else if (e.key === "F5") { e.preventDefault(); setPayment("card"); }
      else if (e.key === "F6") { e.preventDefault(); setPayment("upi"); }
      else if (e.key === "F9") { e.preventDefault(); checkout(); }
      else if (e.key === "Escape") setCart([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, discount, taxRate, payment, customer]);

  const categories = useMemo(() => {
    const s = new Set(products.map(p => p.category).filter(Boolean));
    return ["all", ...Array.from(s)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (category !== "all" && p.category !== category) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.barcode || "").toLowerCase().includes(q);
    });
  }, [products, search, category]);

  const addToCart = (p: Product) => {
    if (p.stock <= 0) { push("Out of stock", "error"); return; }
    setCart(prev => {
      const idx = prev.findIndex(x => x.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        if (next[idx].qty >= p.stock) { push("Reached stock limit", "error"); return prev; }
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, qty: 1, stock: p.stock }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(it => {
      if (it.productId !== id) return it;
      const next = it.qty + delta;
      if (next <= 0) return it;
      if (next > it.stock) { push("Exceeds available stock", "error"); return it; }
      return { ...it, qty: next };
    }).filter(it => it.qty > 0));
  };
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.productId !== id));

  // Auto-add by barcode scanner (Enter triggers)
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const p = products.find(p => p.barcode && p.barcode === search.trim());
      if (p) { addToCart(p); setSearch(""); }
      else if (filtered[0]) { addToCart(filtered[0]); setSearch(""); }
    }
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = subtotal * (discount / 100);
  const taxableAmt = subtotal - discountAmt;
  const taxAmt = taxableAmt * (taxRate / 100);
  const total = taxableAmt + taxAmt;

  const checkout = async () => {
    if (cart.length === 0) { push("Cart is empty", "error"); return; }
    if (!profile) return;
    setProcessing(true);
    try {
      const orderNo = generateOrderNo();
      const orderData = {
        orderNo,
        items: cart,
        subtotal, discount: discountAmt, tax: taxAmt, total,
        payment, customerId: customer?.id || null, customerName: customer?.name || "Walk-in",
        cashierId: profile.uid, cashierName: profile.name,
        createdAt: Date.now(),
      };

      // Transaction: create order + decrement stock
      await runTransaction(db, async (tx) => {
        // Read all product refs first
        const refs = cart.map(c => doc(db, "products", c.productId));
        const snaps = await Promise.all(refs.map(r => tx.get(r)));
        snaps.forEach((s, i) => {
          const cur = (s.data() as Product | undefined);
          const newStock = (cur?.stock ?? 0) - cart[i].qty;
          tx.update(refs[i], { stock: newStock, status: newStock <= 0 ? "out_of_stock" : "in_stock" });
        });
      });

      const orderRef = await addDoc(collection(db, "orders"), orderData);

      // Inventory history
      await Promise.all(cart.map(it =>
        addDoc(collection(db, "inventory"), {
          productId: it.productId, productName: it.name,
          type: "sale", change: -it.qty, orderNo,
          createdAt: Date.now(),
        })
      ));

      // Update customer loyalty
      if (customer) {
        await updateDoc(doc(db, "customers", customer.id), {
          loyaltyPoints: increment(Math.floor(total / 10)),
          totalSpent: increment(total),
          visits: increment(1),
        });
      }

      // Activity log
      await addDoc(collection(db, "activity_logs"), {
        userId: profile.uid, userName: profile.name,
        action: "sale_completed",
        meta: `${orderNo} • ${fmtMoney(total)}`,
        createdAt: Date.now(),
      });

      setCompleted({ id: orderRef.id, ...orderData });
      setCart([]); setDiscount(0); setCustomer(null);
      push("Order completed", "success");
    } catch (err: any) {
      console.error(err);
      push(err?.message || "Checkout failed", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Customer search/create
  const matchedCustomers = customers.filter(c =>
    !custQuery || c.name.toLowerCase().includes(custQuery.toLowerCase()) || c.phone.includes(custQuery)
  );
  const createCustomer = async () => {
    if (!newCust.name || !newCust.phone) { push("Name & phone required", "error"); return; }
    // dedupe by phone
    const q = query(collection(db, "customers"), where("phone", "==", newCust.phone));
    const existing = await getDocs(q);
    if (!existing.empty) {
      const d = existing.docs[0];
      setCustomer({ id: d.id, ...(d.data() as any) });
    } else {
      const ref = await addDoc(collection(db, "customers"), {
        ...newCust, loyaltyPoints: 0, totalSpent: 0, visits: 0, createdAt: Date.now(),
      });
      setCustomer({ id: ref.id, ...newCust, loyaltyPoints: 0, totalSpent: 0, visits: 0 });
    }
    setNewCust({ name: "", phone: "" }); setShowCustomer(false); push("Customer attached", "success");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-[calc(100vh-9rem)]">
      {/* Products */}
      <div className="xl:col-span-2 flex flex-col min-h-0">
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <IconSearch className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Search products or scan barcode (F2)…"
                className="pl-9"
                autoFocus
              />
            </div>
            <Badge variant="info"><IconBarcode className="h-3 w-3 mr-1 inline-block"/>Scanner Ready</Badge>
          </div>
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 h-8 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  category === c
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}>{c === "all" ? "All Items" : c}</button>
            ))}
          </div>
        </Card>

        <Card className="flex-1 p-4 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState
              title="No products"
              desc={products.length === 0 ? "Add products from the Products page to start selling." : "No products match your search."}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  className="group text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center overflow-hidden mb-2 relative">
                    {p.image ? (
                      <img src={p.image} className="w-full h-full object-cover" alt={p.name}/>
                    ) : (
                      <span className="text-3xl font-bold text-slate-400">{p.name?.[0]?.toUpperCase() || "?"}</span>
                    )}
                    {p.stock <= (p.lowStockAt ?? 5) && p.stock > 0 && (
                      <span className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold">Low</span>
                    )}
                    {p.stock <= 0 && (
                      <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold">Out</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{p.category}</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{fmtMoney(p.price)}</span>
                    <span className="text-[10px] text-slate-500">{p.stock} left</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Cart */}
      <div className="flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Current Order</h3>
              <div className="text-xs text-slate-500 mt-0.5">{cart.length} item{cart.length !== 1 && "s"}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowCustomer(true)}>
              {customer ? customer.name : "+ Customer"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <EmptyState title="Cart is empty" desc="Tap a product to add it." />
            ) : (
              <div className="space-y-2">
                {cart.map(it => (
                  <div key={it.productId} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{it.name}</div>
                      <div className="text-xs text-slate-500">{fmtMoney(it.price)} × {it.qty}</div>
                    </div>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button onClick={() => updateQty(it.productId, -1)} className="h-7 w-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-l-lg">
                        <IconMinus className="h-3 w-3"/>
                      </button>
                      <span className="w-7 text-center text-sm font-medium">{it.qty}</span>
                      <button onClick={() => updateQty(it.productId, 1)} className="h-7 w-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r-lg">
                        <IconPlus className="h-3 w-3"/>
                      </button>
                    </div>
                    <div className="w-20 text-right text-sm font-bold text-slate-900 dark:text-white">{fmtMoney(it.price * it.qty)}</div>
                    <button onClick={() => removeItem(it.productId)} className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center">
                      <IconTrash className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Discount %</Label>
                <Input type="number" min={0} max={100} value={discount} onChange={(e) => setDiscount(Math.min(100, Math.max(0, +e.target.value || 0)))} />
              </div>
              <div>
                <Label>Tax (GST) %</Label>
                <Input type="number" min={0} max={100} value={taxRate} onChange={(e) => setTaxRate(Math.max(0, +e.target.value || 0))} />
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Subtotal</span><span>{fmtMoney(subtotal)}</span></div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Discount ({discount}%)</span><span className="text-rose-500">-{fmtMoney(discountAmt)}</span></div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Tax ({taxRate}%)</span><span>{fmtMoney(taxAmt)}</span></div>
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total</span><span>{fmtMoney(total)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: "cash" as PaymentMethod, label: "Cash", icon: IconCash },
                { v: "card" as PaymentMethod, label: "Card", icon: IconCard },
                { v: "upi" as PaymentMethod, label: "UPI", icon: IconUPI },
              ]).map(p => {
                const Icon = p.icon;
                return (
                  <button key={p.v} onClick={() => setPayment(p.v)}
                    className={`h-12 rounded-lg border flex flex-col items-center justify-center text-[11px] font-medium transition ${
                      payment === p.v
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}>
                    <Icon className="h-4 w-4 mb-0.5"/>{p.label}
                  </button>
                );
              })}
            </div>
            <Button onClick={checkout} loading={processing} className="w-full" size="lg">
              Complete Sale (F9) · {fmtMoney(total)}
            </Button>
          </div>
        </Card>
      </div>

      {/* Customer Modal */}
      <Modal open={showCustomer} onClose={() => setShowCustomer(false)} title="Attach Customer">
        <div className="space-y-4">
          <Input placeholder="Search by name or phone…" value={custQuery} onChange={(e) => setCustQuery(e.target.value)} />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {matchedCustomers.slice(0, 8).map(c => (
              <button key={c.id} onClick={() => { setCustomer(c); setShowCustomer(false); push("Customer attached", "success"); }}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.phone}</div>
                </div>
                <Badge variant="info">{c.loyaltyPoints} pts</Badge>
              </button>
            ))}
            {matchedCustomers.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No customers found.</p>}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Or add a new customer</div>
            <div className="space-y-2">
              <Input placeholder="Full Name" value={newCust.name} onChange={(e) => setNewCust(c => ({ ...c, name: e.target.value }))}/>
              <Input placeholder="Phone Number" value={newCust.phone} onChange={(e) => setNewCust(c => ({ ...c, phone: e.target.value }))}/>
              <Button onClick={createCustomer} className="w-full">Add & Attach</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Receipt modal */}
      <Modal open={!!completed} onClose={() => setCompleted(null)} title="Order Receipt" size="md">
        {completed && (
          <div>
            <div id="receipt-print" className="bg-white text-black p-6 rounded-lg border border-slate-200">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <div className="text-xl font-bold tracking-tight">SmartPOS Store</div>
                <div className="text-xs text-slate-600">Thank you for shopping with us!</div>
              </div>
              <div className="text-xs mt-3 grid grid-cols-2 gap-y-1">
                <div><strong>Invoice:</strong> {completed.orderNo}</div>
                <div className="text-right">{fmtDateTime(completed.createdAt)}</div>
                <div><strong>Cashier:</strong> {completed.cashierName}</div>
                <div className="text-right"><strong>Customer:</strong> {completed.customerName}</div>
              </div>
              <table className="w-full text-xs mt-4">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="text-left pb-1">Item</th>
                    <th className="text-right pb-1">Qty</th>
                    <th className="text-right pb-1">Price</th>
                    <th className="text-right pb-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.items.map((it: CartItem, i: number) => (
                    <tr key={i}>
                      <td className="py-1">{it.name}</td>
                      <td className="py-1 text-right">{it.qty}</td>
                      <td className="py-1 text-right">{fmtMoney(it.price)}</td>
                      <td className="py-1 text-right">{fmtMoney(it.price * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-dashed border-slate-300 mt-3 pt-3 text-xs space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{fmtMoney(completed.subtotal)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>-{fmtMoney(completed.discount)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{fmtMoney(completed.tax)}</span></div>
                <div className="flex justify-between font-bold text-sm border-t border-slate-300 pt-1.5 mt-1.5">
                  <span>TOTAL</span><span>{fmtMoney(completed.total)}</span>
                </div>
                <div className="flex justify-between pt-1"><span>Payment</span><span className="uppercase">{completed.payment || "—"}</span></div>
              </div>
              <div className="text-center text-[10px] text-slate-500 mt-4 pt-3 border-t border-dashed border-slate-300">
                * This is a computer-generated invoice. *
              </div>
            </div>
            <div className="flex gap-2 mt-4 no-print">
              <Button variant="outline" className="flex-1" onClick={() => setCompleted(null)}>Close</Button>
              <Button className="flex-1" onClick={() => window.print()}>
                <IconPrint className="h-4 w-4"/> Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
