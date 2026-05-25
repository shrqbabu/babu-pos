import { useState } from 'react';
import { Store, Bell, Shield, Palette, CreditCard, Save, RotateCcw } from 'lucide-react';

interface Settings {
  storeName: string;
  storeAddress: string;
  taxRate: number;
  currency: string;
  receiptFooter: string;
  lowStockAlert: number;
  notifications: boolean;
  darkMode: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  storeName: 'ProPOS Store',
  storeAddress: '123 Main Street, City',
  taxRate: 8,
  currency: 'USD',
  receiptFooter: 'Thank you for your purchase!',
  lowStockAlert: 10,
  notifications: true,
  darkMode: true,
};

export default function SettingsView() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('pos_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  const [saved, setSaved] = useState(false);

  const update = (key: keyof Settings, value: any) => {
    setSettings(s => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('pos_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('pos_settings');
    setSaved(false);
  };

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(51,65,85,0.5)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
          <Icon size={16} style={{ color: '#6366f1' }} />
        </div>
        <h3 className="font-bold text-white text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '' }: any) => (
    <div className="mb-3">
      <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#64748b' }}>{label}</label>
      <input type={type} className="pos-input w-full px-3 py-2.5 text-sm" value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );

  const Toggle = ({ label, desc, checked, onChange }: any) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{desc}</p>}
      </div>
      <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6" style={{ background: '#0f172a' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>Configure your POS system</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5" style={{ background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.5)' }}>
            <RotateCcw size={14} />
            Reset
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: saved ? '0 4px 15px rgba(16,185,129,0.4)' : '0 4px 15px rgba(99,102,241,0.4)' }}>
            <Save size={14} />
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl">
        <Section icon={Store} title="Store Information">
          <InputField label="STORE NAME" value={settings.storeName} onChange={(e: any) => update('storeName', e.target.value)} placeholder="My Juice Bar" />
          <InputField label="STORE ADDRESS" value={settings.storeAddress} onChange={(e: any) => update('storeAddress', e.target.value)} placeholder="123 Main St, City" />
          <InputField label="RECEIPT FOOTER MESSAGE" value={settings.receiptFooter} onChange={(e: any) => update('receiptFooter', e.target.value)} placeholder="Thank you!" />
        </Section>

        <Section icon={CreditCard} title="Tax & Currency">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#64748b' }}>TAX RATE (%)</label>
              <input type="number" className="pos-input w-full px-3 py-2.5 text-sm" value={settings.taxRate} onChange={e => update('taxRate', parseFloat(e.target.value) || 0)} min="0" max="100" step="0.1" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#64748b' }}>CURRENCY</label>
              <select className="pos-input w-full px-3 py-2.5 text-sm" value={settings.currency} onChange={e => update('currency', e.target.value)}>
                <option value="USD">USD – US Dollar</option>
                <option value="EUR">EUR – Euro</option>
                <option value="GBP">GBP – British Pound</option>
                <option value="CAD">CAD – Canadian Dollar</option>
                <option value="AUD">AUD – Australian Dollar</option>
              </select>
            </div>
          </div>
        </Section>

        <Section icon={Bell} title="Notifications & Alerts">
          <InputField label="LOW STOCK ALERT THRESHOLD" type="number" value={settings.lowStockAlert} onChange={(e: any) => update('lowStockAlert', parseInt(e.target.value) || 0)} />
          <Toggle label="Push Notifications" desc="Receive alerts for low stock and daily summaries" checked={settings.notifications} onChange={(v: boolean) => update('notifications', v)} />
          <Toggle label="Dark Mode" desc="Use dark theme throughout the application" checked={settings.darkMode} onChange={(v: boolean) => update('darkMode', v)} />
        </Section>

        <Section icon={Shield} title="Security">
          <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#a5b4fc' }}>🔒 Firebase Security</p>
            <p className="text-xs" style={{ color: '#64748b' }}>Your data is securely stored in Firebase Firestore with real-time sync enabled.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(15,23,42,0.5)' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>Project ID</p>
              <p className="font-mono text-xs text-white">juice-app-d5be7</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(15,23,42,0.5)' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>Database</p>
              <p className="font-mono text-xs text-white">Firestore</p>
            </div>
          </div>
        </Section>

        <Section icon={Palette} title="About">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <p className="font-bold text-white">ProPOS v1.0.0</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Professional Point of Sale System</p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>Powered by React + Firebase</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
