// Inventory Management Page
import { useState } from 'react';
import { Search, Warehouse, AlertTriangle, TrendingDown, Package, RefreshCw, Truck } from 'lucide-react';
import { useCollection } from '../hooks/useFirestore';
import { Collections } from '../firebase/firestore';
import { updateDocument } from '../firebase/firestore';
import Modal from '../components/UI/Modal';
import Badge from '../components/UI/Badge';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);

  const { data: products, loading } = useCollection(Collections.PRODUCTS);

  const filtered = products.filter((p: any) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    let matchStatus = true;
    if (filterStatus === 'low') matchStatus = p.stock > 0 && p.stock <= (p.minStock || 10);
    if (filterStatus === 'out') matchStatus = p.stock !== undefined && p.stock <= 0;
    if (filterStatus === 'ok') matchStatus = p.stock === undefined || p.stock > (p.minStock || 10);
    return matchSearch && matchStatus;
  });

  const lowStockCount = products.filter((p: any) => p.stock > 0 && p.stock <= (p.minStock || 10)).length;
  const outOfStockCount = products.filter((p: any) => p.stock !== undefined && p.stock <= 0).length;
  const inStockCount = products.filter((p: any) => p.stock === undefined || p.stock > (p.minStock || 10)).length;
  const totalInventoryValue = products.reduce((s: number, p: any) => s + ((p.stock || 0) * (p.price || 0)), 0);

  const openRestockModal = (product: any) => {
    setSelectedProduct(product);
    setRestockQty('');
    setRestockNote('');
    setShowRestockModal(true);
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) { toast.error('Enter valid quantity'); return; }
    setSaving(true);
    try {
      const newStock = (selectedProduct.stock || 0) + qty;
      await updateDocument(Collections.PRODUCTS, selectedProduct.id, { stock: newStock });
      toast.success(`Restocked ${qty} units of ${selectedProduct.name}`);
      setShowRestockModal(false);
    } catch { toast.error('Failed to update stock'); }
    finally { setSaving(false); }
  };

  const getStockStatus = (p: any) => {
    if (p.stock !== undefined && p.stock <= 0) return { label: 'Out of Stock', color: 'red' as const };
    if (p.stock !== undefined && p.stock <= (p.minStock || 10)) return { label: 'Low Stock', color: 'yellow' as const };
    return { label: 'In Stock', color: 'green' as const };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Inventory</h1>
          <p className="text-gray-500 text-sm">Track and manage stock levels</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-xs font-medium">{inStockCount}</span>
          </div>
          <p className="text-gray-400 text-sm">In Stock</p>
        </div>
        <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-medium">{lowStockCount}</span>
          </div>
          <p className="text-gray-400 text-sm">Low Stock</p>
        </div>
        <div className="bg-gray-900 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-xs font-medium">{outOfStockCount}</span>
          </div>
          <p className="text-gray-400 text-sm">Out of Stock</p>
        </div>
        <div className="bg-gray-900 border border-indigo-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Warehouse className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-gray-400 text-sm">Inventory Value</p>
          <p className="text-white font-bold text-lg">₹{totalInventoryValue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'ok', 'low', 'out'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors capitalize ${
                filterStatus === status ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {status === 'ok' ? 'In Stock' : status === 'all' ? 'All' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockCount + outOfStockCount > 0 && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-300 text-sm">
            <strong>{outOfStockCount}</strong> products are out of stock and <strong>{lowStockCount}</strong> are running low.
            Restock them soon to avoid lost sales.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <Warehouse className="w-12 h-12 mb-3" />
            <p className="font-medium">No inventory data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-500">
                  <th className="text-left px-5 py-3 font-medium">Product</th>
                  <th className="text-left px-5 py-3 font-medium">Category</th>
                  <th className="text-left px-5 py-3 font-medium">Current Stock</th>
                  <th className="text-left px-5 py-3 font-medium">Min Alert</th>
                  <th className="text-left px-5 py-3 font-medium">Value</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((product: any) => {
                  const status = getStockStatus(product);
                  const value = (product.stock || 0) * (product.price || 0);
                  return (
                    <tr key={product.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-800 overflow-hidden flex items-center justify-center">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <p className="text-white font-medium">{product.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400">{product.category || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                status.color === 'red' ? 'bg-red-500' :
                                status.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, ((product.stock || 0) / Math.max(product.minStock * 3 || 30, 1)) * 100)}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${
                            status.color === 'red' ? 'text-red-400' :
                            status.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
                          }`}>{product.stock ?? '∞'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{product.minStock || 10}</td>
                      <td className="px-5 py-3 text-indigo-400 font-medium">₹{value.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3">
                        <Badge label={status.label} color={status.color} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => openRestockModal(product)}
                          className="flex items-center gap-1.5 ml-auto text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      <Modal isOpen={showRestockModal} onClose={() => setShowRestockModal(false)} title="Restock Product" size="sm">
        {selectedProduct && (
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-white font-medium">{selectedProduct.name}</p>
              <p className="text-gray-500 text-sm mt-0.5">Current stock: <span className="text-yellow-400 font-semibold">{selectedProduct.stock || 0} units</span></p>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Add Quantity *</label>
              <input
                type="number"
                value={restockQty}
                onChange={e => setRestockQty(e.target.value)}
                required min="1"
                placeholder="Enter units to add"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500"
              />
              {restockQty && (
                <p className="text-green-400 text-xs mt-1">
                  New stock: {(selectedProduct.stock || 0) + (parseInt(restockQty) || 0)} units
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Note (Optional)</label>
              <input
                value={restockNote}
                onChange={e => setRestockNote(e.target.value)}
                placeholder="Supplier name, purchase order..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowRestockModal(false)}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" />
                {saving ? 'Saving...' : 'Restock'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
