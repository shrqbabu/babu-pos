// Settings Page for SmartPOS
import { useState, useEffect } from 'react';
import { Save, Store, Percent, Bell, Shield, Database, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addDocument, getCollection, updateDocument, Collections } from '../firebase/firestore';
import toast from 'react-hot-toast';

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  currency: string;
  taxRate: number;
  invoicePrefix: string;
  footerText: string;
  lowStockAlert: number;
  enableLoyalty: boolean;
  loyaltyRate: number;
}

const defaultSettings: StoreSettings = {
  storeName: 'SmartPOS Store',
  storeAddress: '123 Main Street, City, State - 400001',
  storePhone: '+91 98765 43210',
  storeEmail: 'store@smartpos.com',
  currency: 'INR',
  taxRate: 18,
  invoicePrefix: 'INV',
  footerText: 'Thank you for your business!',
  lowStockAlert: 10,
  enableLoyalty: true,
  loyaltyRate: 10,
};

export default function Settings() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [docId, setDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');
  const { userData } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docs = await getCollection(Collections.SETTINGS);
        if (docs.length > 0) {
          const doc = docs[0] as any;
          setDocId(doc.id);
          setSettings({ ...defaultSettings, ...doc });
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (docId) {
        await updateDocument(Collections.SETTINGS, docId, settings);
      } else {
        const id = await addDocument(Collections.SETTINGS, settings);
        setDocId(id);
      }
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'tax', label: 'Tax & Billing', icon: Percent },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'loyalty', label: 'Loyalty', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Settings</h1>
          <p className="text-gray-500 text-sm">Configure your SmartPOS system</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Store Info */}
      {activeTab === 'store' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-400" />
            Store Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Store Name</label>
              <input
                value={settings.storeName}
                onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Invoice Prefix</label>
              <input
                value={settings.invoicePrefix}
                onChange={e => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-400 text-sm mb-1.5">Store Address</label>
              <textarea
                value={settings.storeAddress}
                onChange={e => setSettings({ ...settings, storeAddress: e.target.value })}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Phone Number</label>
              <input
                value={settings.storePhone}
                onChange={e => setSettings({ ...settings, storePhone: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Email</label>
              <input
                type="email"
                value={settings.storeEmail}
                onChange={e => setSettings({ ...settings, storeEmail: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-400 text-sm mb-1.5">Receipt Footer Text</label>
              <input
                value={settings.footerText}
                onChange={e => setSettings({ ...settings, footerText: e.target.value })}
                placeholder="Thank you message..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tax & Billing */}
      {activeTab === 'tax' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Percent className="w-5 h-5 text-indigo-400" />
            Tax & Billing Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Currency</label>
              <select
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">GST / Tax Rate (%)</label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={e => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                min="0" max="100" step="0.5"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> The default tax rate is applied to all new POS transactions.
              Cashiers can modify the rate per transaction if needed.
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Alert Settings
          </h3>
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Low Stock Alert Threshold</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={settings.lowStockAlert}
                onChange={e => setSettings({ ...settings, lowStockAlert: parseInt(e.target.value) || 10 })}
                min="1"
                className="w-32 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <span className="text-gray-400 text-sm">units remaining</span>
            </div>
            <p className="text-gray-600 text-xs mt-1.5">Alert when product stock falls below this number</p>
          </div>
        </div>
      )}

      {/* Loyalty */}
      {activeTab === 'loyalty' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Loyalty Program
          </h3>
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Loyalty Points</p>
              <p className="text-gray-500 text-sm">Reward customers with points on each purchase</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enableLoyalty: !settings.enableLoyalty })}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableLoyalty ? 'bg-indigo-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.enableLoyalty ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {settings.enableLoyalty && (
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Points per ₹</label>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">1 point per ₹</span>
                <input
                  type="number"
                  value={settings.loyaltyRate}
                  onChange={e => setSettings({ ...settings, loyaltyRate: parseInt(e.target.value) || 10 })}
                  min="1"
                  className="w-24 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <span className="text-gray-400 text-sm">spent</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          Account Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-500 mb-1">Signed in as</p>
            <p className="text-white font-medium">{userData?.displayName}</p>
            <p className="text-gray-500">{userData?.email}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-500 mb-1">Role</p>
            <p className="text-indigo-400 font-semibold capitalize">{userData?.role}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-500 mb-1">Firebase Project</p>
            <p className="text-white font-mono text-xs">juice-app-d5be7</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-500 mb-1">App Version</p>
            <p className="text-white font-medium flex items-center gap-1.5">
              SmartPOS v1.0.0
              <span className="bg-green-500/15 text-green-400 text-xs px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Check className="w-3 h-3" /> Live
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
