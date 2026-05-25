// SmartPOS - Main Application Component
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { POSProvider } from './context/POSContext';
import LoadingSpinner from './components/UI/LoadingSpinner';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Orders from './pages/Orders';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  pos: 'POS Billing',
  orders: 'Orders',
  products: 'Products',
  categories: 'Categories',
  customers: 'Customers',
  employees: 'Employees',
  inventory: 'Inventory',
  reports: 'Reports & Analytics',
  settings: 'Settings',
};

function AppContent() {
  const { currentUser, userData, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  if (loading) return <LoadingSpinner fullScreen />;
  if (!currentUser || !userData) return <Login />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'orders': return <Orders />;
      case 'products': return <Products />;
      case 'categories': return <Categories />;
      case 'customers': return <Customers />;
      case 'employees': return <Employees />;
      case 'inventory': return <Inventory />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <POSProvider>
      <div className="flex h-screen bg-gray-950 overflow-hidden">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={pageTitles[currentPage] || 'SmartPOS'} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {renderPage()}
          </main>
        </div>
      </div>
    </POSProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#1f2937' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1f2937' },
          },
        }}
      />
    </AuthProvider>
  );
}
