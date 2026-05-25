// Customers Management Page
import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail, Star, ShoppingBag } from 'lucide-react';
import { useCollection, useFirestore } from '../hooks/useFirestore';
import { Collections } from '../firebase/firestore';
import Modal from '../components/UI/Modal';

import toast from 'react-hot-toast';

interface Customer {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  loyaltyPoints: number;
  totalPurchases: number;
}

const emptyCustomer: Customer = {
  name: '', phone: '', email: '', address: '', loyaltyPoints: 0, totalPurchases: 0,
};

export default function Customers() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Customer>(emptyCustomer);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: customers, loading } = useCollection(Collections.CUSTOMERS);
  const { data: orders } = useCollection(Collections.ORDERS);
  const { add, update, remove, loading: saving } = useFirestore(Collections.CUSTOMERS);

  const filtered = customers.filter((c: any) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerOrders = (customerId: string) =>
    orders.filter((o: any) => o.customerId === customerId);

  const openAddModal = () => {
    setEditCustomer(null);
    setForm(emptyCustomer);
    setShowModal(true);
  };

  const openEditModal = (customer: any) => {
    setEditCustomer(customer);
    setForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      loyaltyPoints: customer.loyaltyPoints || 0,
      totalPurchases: customer.totalPurchases || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    try {
      if (editCustomer?.id) {
        await update(editCustomer.id, form);
        toast.success('Customer updated!');
      } else {
        await add(form);
        toast.success('Customer added!');
      }
      setShowModal(false);
    } catch { toast.error('Failed to save customer'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success('Customer deleted');
      setDeleteConfirm(null);
    } catch { toast.error('Failed to delete'); }
  };

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Customers</h1>
          <p className="text-gray-500 text-sm">{customers.length} registered customers</p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-sm">Total Customers</p>
          <p className="text-white text-2xl font-bold mt-1">{customers.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-white text-2xl font-bold mt-1">
            {formatCurrency(customers.reduce((s: number, c: any) => s + (c.totalPurchases || 0), 0))}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-sm">Loyalty Points Issued</p>
          <p className="text-white text-2xl font-bold mt-1">
            {customers.reduce((s: number, c: any) => s + (c.loyaltyPoints || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone or email..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <Users className="w-12 h-12 mb-3" />
            <p className="font-medium">No customers found</p>
            <p className="text-sm mt-1">Add customers to build your CRM</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-500">
                  <th className="text-left px-5 py-3 font-medium">Customer</th>
                  <th className="text-left px-5 py-3 font-medium">Contact</th>
                  <th className="text-left px-5 py-3 font-medium">Orders</th>
                  <th className="text-left px-5 py-3 font-medium">Total Spent</th>
                  <th className="text-left px-5 py-3 font-medium">Loyalty Points</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((customer: any) => {
                  const custOrders = getCustomerOrders(customer.id);
                  return (
                    <tr key={customer.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
                            {customer.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p className="text-white font-medium">{customer.name}</p>
                            <p className="text-gray-500 text-xs">{customer.address || 'No address'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-gray-300 flex items-center gap-1.5"><Phone className="w-3 h-3" />{customer.phone}</p>
                        {customer.email && <p className="text-gray-500 text-xs flex items-center gap-1.5 mt-0.5"><Mail className="w-3 h-3" />{customer.email}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {custOrders.length}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-green-400 font-semibold">
                        {formatCurrency(customer.totalPurchases || 0)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-yellow-400">
                          <Star className="w-3.5 h-3.5" />
                          {(customer.loyaltyPoints || 0).toLocaleString()} pts
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(customer)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(customer.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCustomer ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Full Name *</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required placeholder="Customer name"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Phone Number *</label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required placeholder="+91 98765 43210"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="customer@email.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Address</label>
            <textarea
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              rows={2}
              placeholder="Customer address..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
              {editCustomer ? 'Update' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold text-lg mb-1">Delete Customer?</h3>
            <p className="text-gray-400 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
