// Sidebar Navigation Component
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Users, UserCog,
  BarChart3, Settings, ChevronLeft, ChevronRight, LogOut,
  Warehouse, Receipt, Tag, Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../firebase/auth';
import toast from 'react-hot-toast';

interface NavItem {
  icon: React.ElementType;
  label: string;
  page: string;
  adminOnly?: boolean;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: ShoppingCart, label: 'POS Billing', page: 'pos' },
  { icon: Receipt, label: 'Orders', page: 'orders' },
  { icon: Package, label: 'Products', page: 'products', adminOnly: true },
  { icon: Tag, label: 'Categories', page: 'categories', adminOnly: true },
  { icon: Users, label: 'Customers', page: 'customers' },
  { icon: UserCog, label: 'Employees', page: 'employees', adminOnly: true },
  { icon: Warehouse, label: 'Inventory', page: 'inventory', adminOnly: true },
  { icon: BarChart3, label: 'Reports', page: 'reports', adminOnly: true },
  { icon: Settings, label: 'Settings', page: 'settings', adminOnly: true },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { userData, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside
      className={`relative flex flex-col h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="flex-shrink-0 w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-white font-bold text-lg leading-none">SmartPOS</h1>
            <p className="text-gray-500 text-xs mt-0.5">Point of Sale</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {filteredNav.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 group relative ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className={`flex-shrink-0 w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {collapsed && (
                <div className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
              {item.badge && !collapsed && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-800 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userData?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{userData?.displayName || 'User'}</p>
              <p className="text-gray-500 text-xs capitalize">{userData?.role || 'cashier'}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-indigo-500 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
