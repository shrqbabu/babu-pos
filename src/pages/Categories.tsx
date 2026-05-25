// Categories Management Page
import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Search } from 'lucide-react';
import { useCollection, useFirestore } from '../hooks/useFirestore';
import { Collections } from '../firebase/firestore';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';

const categoryIcons = ['🍔', '🥤', '🍕', '🛒', '💊', '📱', '👗', '🏠', '🎮', '📚', '🧴', '🌿'];

export default function Categories() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '🛒', color: 'indigo' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: categories, loading } = useCollection(Collections.CATEGORIES);
  const { data: products } = useCollection(Collections.PRODUCTS);
  const { add, update, remove, loading: saving } = useFirestore(Collections.CATEGORIES);

  const filtered = categories.filter((c: any) => !search || c.name?.toLowerCase().includes(search.toLowerCase()));

  const getProductCount = (catName: string) => products.filter((p: any) => p.category === catName).length;

  const openAddModal = () => {
    setEditCat(null);
    setForm({ name: '', description: '', icon: '🛒', color: 'indigo' });
    setShowModal(true);
  };

  const openEditModal = (cat: any) => {
    setEditCat(cat);
    setForm({ name: cat.name || '', description: cat.description || '', icon: cat.icon || '🛒', color: cat.color || 'indigo' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Category name is required'); return; }
    try {
      if (editCat?.id) {
        await update(editCat.id, form);
        toast.success('Category updated!');
      } else {
        await add(form);
        toast.success('Category added!');
      }
      setShowModal(false);
    } catch { toast.error('Failed to save category'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success('Category deleted');
      setDeleteConfirm(null);
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Categories</h1>
          <p className="text-gray-500 text-sm">{categories.length} categories</p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-600">
              <Tag className="w-12 h-12 mb-3" />
              <p className="font-medium">No categories yet</p>
              <p className="text-sm mt-1">Create categories to organize your products</p>
            </div>
          ) : (
            filtered.map((cat: any) => {
              const count = getProductCount(cat.name);
              return (
                <div key={cat.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{cat.icon || '🛒'}</div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(cat)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(cat.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-lg">{cat.name}</h3>
                  <p className="text-gray-500 text-sm mt-0.5">{cat.description || 'No description'}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{count} product{count !== 1 ? 's' : ''}</span>
                    <div className={`h-1.5 rounded-full bg-indigo-500 w-16`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCat ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Category Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              required placeholder="e.g. Food & Beverages"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Short description..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {categoryIcons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`text-2xl p-2 rounded-xl transition-colors ${
                    form.icon === icon ? 'bg-indigo-500/20 ring-2 ring-indigo-500' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white py-2.5 rounded-xl text-sm font-medium">
              {editCat ? 'Update' : 'Add Category'}
            </button>
          </div>
        </form>
      </Modal>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold text-lg mb-1">Delete Category?</h3>
            <p className="text-gray-400 text-sm mb-5">Products in this category won't be deleted, but will become uncategorized.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
