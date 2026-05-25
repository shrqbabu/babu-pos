// Employees Management Page
import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCog, Shield, Activity } from 'lucide-react';
import { useCollection, useFirestore } from '../hooks/useFirestore';
import { Collections } from '../firebase/firestore';
import { signUp } from '../firebase/auth';
import Modal from '../components/UI/Modal';
import Badge from '../components/UI/Badge';
import toast from 'react-hot-toast';

const roles = ['admin', 'manager', 'cashier'];

interface EmployeeForm {
  displayName: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  salary: number;
  isActive: boolean;
}

const emptyForm: EmployeeForm = {
  displayName: '', email: '', password: '', role: 'cashier',
  phone: '', salary: 0, isActive: true,
};

export default function Employees() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: employees, loading } = useCollection(Collections.USERS);
  const { data: orders } = useCollection(Collections.ORDERS);
  const { update, remove } = useFirestore(Collections.USERS);

  const filtered = employees.filter((e: any) =>
    !search ||
    e.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.role?.toLowerCase().includes(search.toLowerCase())
  );

  const getEmployeeSales = (uid: string) => {
    const empOrders = orders.filter((o: any) => o.cashierId === uid);
    const revenue = empOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    return { count: empOrders.length, revenue };
  };

  const openAddModal = () => {
    setEditEmployee(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (emp: any) => {
    setEditEmployee(emp);
    setForm({
      displayName: emp.displayName || '',
      email: emp.email || '',
      password: '',
      role: emp.role || 'cashier',
      phone: emp.phone || '',
      salary: emp.salary || 0,
      isActive: emp.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editEmployee?.id || editEmployee?.uid) {
        const id = editEmployee.id || editEmployee.uid;
        await update(id, {
          displayName: form.displayName,
          role: form.role,
          phone: form.phone,
          salary: Number(form.salary),
          isActive: form.isActive,
        });
        toast.success('Employee updated!');
      } else {
        if (!form.email || !form.password) { toast.error('Email and password required'); setSaving(false); return; }
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); setSaving(false); return; }
        await signUp(form.email, form.password, form.displayName, form.role as any);
        // Update extra fields
        toast.success('Employee account created!');
      }
      setShowModal(false);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') toast.error('Email already in use');
      else toast.error('Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success('Employee removed');
      setDeleteConfirm(null);
    } catch { toast.error('Failed to remove employee'); }
  };

  const getRoleColor = (role: string) => {
    const map: Record<string, any> = { admin: 'red', manager: 'yellow', cashier: 'blue' };
    return map[role] || 'gray';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Employees</h1>
          <p className="text-gray-500 text-sm">{employees.length} team members</p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-3 gap-3">
        {roles.map(role => {
          const count = employees.filter((e: any) => e.role === role).length;
          return (
            <div key={role} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs capitalize mb-1">{role}s</p>
              <p className="text-white font-bold text-xl">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or role..."
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
            <UserCog className="w-12 h-12 mb-3" />
            <p className="font-medium">No employees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-500">
                  <th className="text-left px-5 py-3 font-medium">Employee</th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-left px-5 py-3 font-medium">Phone</th>
                  <th className="text-left px-5 py-3 font-medium">Orders</th>
                  <th className="text-left px-5 py-3 font-medium">Revenue</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((emp: any) => {
                  const sales = getEmployeeSales(emp.uid || emp.id);
                  return (
                    <tr key={emp.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm flex-shrink-0">
                            {emp.displayName?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <p className="text-white font-medium">{emp.displayName}</p>
                            <p className="text-gray-500 text-xs">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-gray-500" />
                          <Badge label={emp.role || 'cashier'} color={getRoleColor(emp.role)} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400">{emp.phone || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Activity className="w-3.5 h-3.5" />
                          {sales.count}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-green-400 font-medium">
                        ₹{sales.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3">
                        <Badge label={emp.isActive !== false ? 'Active' : 'Inactive'} color={emp.isActive !== false ? 'green' : 'gray'} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(emp)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(emp.id)}
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

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editEmployee ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Full Name *</label>
            <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
              required placeholder="Employee name"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          {!editEmployee && (
            <>
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  required placeholder="employee@smartpos.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required placeholder="Min 6 characters"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500">
                {roles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-gray-400 text-sm mb-1.5">Monthly Salary (₹)</label>
              <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: parseFloat(e.target.value) || 0 })}
                min="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex-1">
              <label className="block text-gray-400 text-sm mb-1.5">Status</label>
              <select value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white py-2.5 rounded-xl text-sm font-medium">
              {editEmployee ? 'Update' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold text-lg mb-1">Remove Employee?</h3>
            <p className="text-gray-400 text-sm mb-5">Their account data will be removed from the system.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
