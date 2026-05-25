import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, X, Package } from 'lucide-react';
import { Product } from '../types';

interface ProductsViewProps {
  products: Product[];
  onAdd: (p: Omit<Product, 'id'>) => void;
  onUpdate: (id: string, data: Partial<Product>) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES = ['Juices', 'Smoothies', 'Shakes', 'Cold Drinks', 'Coffee', 'Other'];
const EMOJIS = ['🍊', '🍎', '🥭', '🍓', '🥬', '🍋', '🍉', '🥥', '🍍', '🫐', '☕', '🧋', '⚡', '🍑', '🍫', '🍦', '🥤', '🌿'];

const defaultForm = {
  name: '', price: '', cost: '', category: 'Juices', emoji: '🍊', stock: '', description: '',
};

export default function ProductsView({ products, onAdd, onUpdate, onDelete }: ProductsViewProps) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = products.filter(p => {
    const matchS = p.name.toLowerCase().includes(search.toLowerCase());
    const matchC = catFilter === 'All' || p.category === catFilter;
    return matchS && matchC;
  });

  const openAdd = () => { setForm(defaultForm); setEditTarget(null); setShowModal(true); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, price: String(p.price), cost: String(p.cost ?? ''), category: p.category, emoji: p.emoji, stock: String(p.stock), description: p.description ?? '' });
    setEditTarget(p);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.price) return;
    const data = {
      name: form.name.trim(),
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      category: form.category,
      emoji: form.emoji,
      stock: parseInt(form.stock) || 0,
      description: form.description,
    };
    if (editTarget) {
      onUpdate(editTarget.id, data);
    } else {
      onAdd(data);
    }
    setShowModal(false);
  };

  const allCats = ['All', ...CATEGORIES];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Products</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>{products.length} total products</p>
        </div>
        <button
          onClick={openAdd}
          className="checkout-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            className="pos-input w-full pl-9 pr-4 py-2.5 text-sm"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {allCats.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: catFilter === c ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(30,41,59,0.8)',
                color: catFilter === c ? 'white' : '#94a3b8',
                border: `1px solid ${catFilter === c ? 'transparent' : 'rgba(51,65,85,0.5)'}`,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(product => (
            <div key={product.id} className="rounded-2xl p-4 group relative overflow-hidden" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(51,65,85,0.5)', transition: 'border-color 0.2s' }}>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors" style={{ color: '#6366f1', background: 'rgba(15,23,42,0.8)' }}>
                  <Pencil size={12} />
                </button>
                <button onClick={() => setConfirmDelete(product.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors" style={{ color: '#ef4444', background: 'rgba(15,23,42,0.8)' }}>
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="text-3xl mb-2">{product.emoji}</div>
              <p className="font-bold text-sm text-white leading-tight mb-1">{product.name}</p>
              <p className="text-xs mb-2" style={{ color: '#64748b' }}>{product.category}</p>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm" style={{ color: '#a5b4fc' }}>${product.price.toFixed(2)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: product.stock > 10 ? 'rgba(16,185,129,0.15)' : product.stock > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                  color: product.stock > 10 ? '#10b981' : product.stock > 0 ? '#f59e0b' : '#ef4444',
                }}>
                  Stock: {product.stock}
                </span>
              </div>
              {product.cost && (
                <p className="text-xs" style={{ color: '#64748b' }}>Cost: ${product.cost.toFixed(2)} · Margin: {Math.round(((product.price - product.cost) / product.price) * 100)}%</p>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <Package size={48} className="mb-3" style={{ color: '#334155' }} />
              <p className="font-semibold text-white">No products found</p>
              <p className="text-sm" style={{ color: '#64748b' }}>Try a different search or add a new product</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-card w-full max-w-md mx-4 p-6 slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{editTarget ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/10" style={{ color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Emoji picker */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: '#64748b' }}>ICON</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      className="w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{ background: form.emoji === e ? 'rgba(99,102,241,0.3)' : 'rgba(15,23,42,0.5)', border: `1px solid ${form.emoji === e ? '#6366f1' : 'rgba(51,65,85,0.5)'}` }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>NAME</label>
                <input className="pos-input w-full px-3 py-2.5 text-sm" placeholder="Product name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>PRICE ($)</label>
                  <input type="number" className="pos-input w-full px-3 py-2.5 text-sm" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} min="0" step="0.01" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>COST ($)</label>
                  <input type="number" className="pos-input w-full px-3 py-2.5 text-sm" placeholder="0.00" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} min="0" step="0.01" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>CATEGORY</label>
                  <select className="pos-input w-full px-3 py-2.5 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>STOCK</label>
                  <input type="number" className="pos-input w-full px-3 py-2.5 text-sm" placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} min="0" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>DESCRIPTION (optional)</label>
                <textarea className="pos-input w-full px-3 py-2.5 text-sm resize-none" rows={2} placeholder="Short description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.5)' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="checkout-btn flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" disabled={!form.name || !form.price}>
                {editTarget ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="glass-card w-full max-w-sm mx-4 p-6 slide-up text-center" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Product?</h3>
            <p className="text-sm mb-5" style={{ color: '#64748b' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.5)' }}>
                Cancel
              </button>
              <button onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
