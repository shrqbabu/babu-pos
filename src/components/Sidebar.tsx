import {
  ShoppingCart, BarChart3, Package, ClipboardList,
  Settings, Zap, LogOut, ChevronRight
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (v: ViewType) => void;
  cartCount: number;
  todaySales: number;
}

const navItems = [
  { id: 'pos' as ViewType, label: 'Point of Sale', icon: ShoppingCart },
  { id: 'orders' as ViewType, label: 'Orders', icon: ClipboardList },
  { id: 'products' as ViewType, label: 'Products', icon: Package },
  { id: 'analytics' as ViewType, label: 'Analytics', icon: BarChart3 },
  { id: 'settings' as ViewType, label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeView, setActiveView, cartCount, todaySales }: SidebarProps) {
  return (
    <div className="w-64 h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1a1f35 100%)', borderRight: '1px solid rgba(99,102,241,0.15)' }}>
      {/* Logo */}
      <div className="p-5 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">ProPOS</h1>
            <p className="text-xs" style={{ color: '#6366f1' }}>Point of Sale</p>
          </div>
        </div>
      </div>

      {/* Today's quick stat */}
      <div className="mx-4 mb-4 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Today's Revenue</p>
        <p className="text-xl font-bold" style={{ color: '#a5b4fc' }}>${todaySales.toFixed(2)}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`nav-item w-full flex items-center gap-3 px-3 py-3 text-sm font-medium ${activeView === id ? 'active' : ''}`}
            style={{ color: activeView === id ? '#a5b4fc' : '#94a3b8' }}
          >
            <Icon size={18} />
            <span className="flex-1 text-left">{label}</span>
            {id === 'pos' && cartCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold badge-pulse" style={{ background: '#6366f1', color: 'white' }}>
                {cartCount}
              </span>
            )}
            {activeView === id && <ChevronRight size={14} style={{ color: '#6366f1' }} />}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
        <div className="flex items-center gap-3 p-2 rounded-xl mb-3" style={{ background: 'rgba(30,41,59,0.6)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Admin</p>
            <p className="text-xs truncate" style={{ color: '#64748b' }}>admin@propos.app</p>
          </div>
        </div>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-red-500/10" style={{ color: '#64748b' }}>
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
