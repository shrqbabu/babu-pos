import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { DEMO_PRODUCTS, DEMO_CATEGORIES } from '../data/demoData';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  categoryId: string;
  barcode: string;
  taxRate: number;
  unit: string;
  lowStockAlert: number;
  status: string;
  image: string;
  description?: string;
}

const categoryOptions = [
  { value: '', label: 'Select Category' },
  ...DEMO_CATEGORIES.map(c => ({ value: c.id, label: c.name }))
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

const defaultForm = {
  name: '', price: '', stock: '', category: '', categoryId: '',
  barcode: '', taxRate: '5', unit: 'piece', lowStockAlert: '10',
  description: '', status: 'active', image: ''
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof defaultForm>(defaultForm);
  const [loading, setLoading] = useState(false);

  // Filter products
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const matchCat = !filterCategory || p.categoryId === filterCategory;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const openAdd = () => {
    setEditingProduct(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, price: String(product.price), stock: String(product.stock),
      category: product.category, categoryId: product.categoryId, barcode: product.barcode || '',
      taxRate: String(product.taxRate), unit: product.unit, lowStockAlert: String(product.lowStockAlert),
      description: product.description || '', status: product.status, image: product.image || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setLoading(true);

    const cat = DEMO_CATEGORIES.find(c => c.id === form.categoryId);
    const productData: Product = {
      id: editingProduct?.id || ''`,
      name: form.name,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      category: cat?.name || form.category,
      categoryId: form.categoryId,
      barcode: form.barcode,
      taxRate: parseFloat(form.taxRate) || 0,
      unit: form.unit,
      lowStockAlert: parseInt(form.lowStockAlert) || 10,
      description: form.description,
      status: form.status as 'active' | 'inactive',
      image: form.image
    };

    try {

  if (editingProduct) {

    await updateDoc(doc(db, 'products', editingProduct.id), {
      ...productData
    });

    setProducts(prev =>
      prev.map(p => p.id === editingProduct.id ? productData : p)
    );

    toast.success('Product updated successfully');

  } else {

    const docRef = await addDoc(collection(db, 'products'), productData);

    setProducts(prev => [
      { ...productData, id: docRef.id },
      ...prev
    ]);

    toast.success('Product added successfully');
  }

  setShowModal(false);

} catch (error) {
  console.error(error);
  toast.error('Failed to save product');
}

setLoading(false);

  try {

  await deleteDoc(doc(db, 'products', deleteId));

  setProducts(prev => prev.filter(p => p.id !== deleteId));

  toast.success('Product deleted');

} catch (error) {
  console.error(error);
  toast.error('Failed to delete product');
}

setDeleteId(null);

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    outOfStock: products.filter(p => p.stock === 0).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= p.lowStockAlert).length,
  };

  const columns = [
    {
      key: 'name', title: 'Product',
      render: (_: any, row: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-base">{DEMO_CATEGORIES.find(c => c.id === row.categoryId)?.icon || '📦'}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-slate-400">{row.barcode || 'No barcode'}</p>
          </div>
        </div>
      )
    },
    { key: 'category', title: 'Category',
      render: (_: any, row: Product) => <span className="text-sm text-slate-600 dark:text-slate-400">{row.category}</span>
    },
    { key: 'price', title: 'Price', align: 'right' as const,
      render: (v: number) => <span className="text-sm font-semibold text-slate-900 dark:text-white">₹{v.toLocaleString()}</span>
    },
    { key: 'stock', title: 'Stock', align: 'center' as const,
      render: (v: number, row: Product) => (
        <div className="flex items-center justify-center gap-1">
          {v === 0
            ? <Badge variant="danger" dot>Out of Stock</Badge>
            : v <= row.lowStockAlert
              ? <><Badge variant="warning" dot>{v} {row.unit}s</Badge><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></>
              : <Badge variant="success" dot>{v} {row.unit}s</Badge>
          }
        </div>
      )
    },
    { key: 'taxRate', title: 'Tax', align: 'center' as const,
      render: (v: number) => <span className="text-xs text-slate-500">{v}%</span>
    },
    { key: 'status', title: 'Status', align: 'center' as const,
      render: (v: string) => <Badge variant={v === 'active' ? 'success' : 'default'}>{v}</Badge>
    },
    {
      key: 'actions', title: 'Actions', align: 'center' as const,
      render: (_: any, row: Product) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-600 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteId(row.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <Layout title="Products" subtitle="Manage your product catalog">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Products', value: stats.total, color: 'indigo' },
          { label: 'Active Products', value: stats.active, color: 'emerald' },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'red' },
          { label: 'Low Stock', value: stats.lowStock, color: 'amber' },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Products Table */}
      <Card padding={false}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 
                rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 
                text-slate-600 dark:text-slate-400 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {DEMO_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 
                text-slate-600 dark:text-slate-400 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <Button onClick={openAdd} icon={<Plus className="w-4 h-4" />}>
              Add Product
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filtered}
          emptyMessage="No products found. Add your first product!"
          emptyIcon={<Package className="w-12 h-12" />}
          rowKey={(row) => row.id}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={loading}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Product Name *"
              placeholder="e.g. Cappuccino"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          
          <Input
            label="Price (₹) *"
            type="number"
            placeholder="0.00"
            value={form.price}
            onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
          />
          
          <Input
            label="Stock Quantity"
            type="number"
            placeholder="0"
            value={form.stock}
            onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
          />

          <Select
            label="Category"
            options={categoryOptions}
            value={form.categoryId}
            onChange={e => {
              const cat = DEMO_CATEGORIES.find(c => c.id === e.target.value);
              setForm(p => ({ ...p, categoryId: e.target.value, category: cat?.name || '' }));
            }}
          />

          <Input
            label="Barcode"
            placeholder="e.g. 8901234567890"
            value={form.barcode}
            onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))}
          />

          <Input
            label="Tax Rate (%)"
            type="number"
            placeholder="0"
            value={form.taxRate}
            onChange={e => setForm(p => ({ ...p, taxRate: e.target.value }))}
          />

          <Input
            label="Unit"
            placeholder="e.g. piece, kg, litre"
            value={form.unit}
            onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
          />

          <Input
            label="Low Stock Alert Threshold"
            type="number"
            placeholder="10"
            value={form.lowStockAlert}
            onChange={e => setForm(p => ({ ...p, lowStockAlert: e.target.value }))}
          />

          <Select
            label="Status"
            options={statusOptions}
            value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
          />

          <div className="col-span-2">
            <Textarea
              label="Description"
              placeholder="Product description..."
              value={form.description}
              rows={2}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="col-span-2">
            <Input
              label="Image URL"
              placeholder="https://example.com/image.jpg"
              value={form.image}
              onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
              helperText="Paste an image URL or upload to Firebase Storage"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
      />
    </Layout>
  );
}
