import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import POSView from './components/POSView';
import OrdersView from './components/OrdersView';
import ProductsView from './components/ProductsView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import { useProducts } from './hooks/useProducts';
import { useOrders } from './hooks/useOrders';
import { ViewType } from './types';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('pos');
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct, updateStock } = useProducts();
  const { orders, loading: ordersLoading, refundOrder, getTodaySales } = useOrders();

  const cartCount = 0; // managed inside POSView
  const todaySales = getTodaySales();

  if (productsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ProPOS</h1>
          <p className="text-sm mb-4" style={{ color: '#64748b' }}>Loading your data...</p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: '#6366f1',
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f172a' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#f1f5f9' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' },
          },
        }}
      />

      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        cartCount={cartCount}
        todaySales={todaySales}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3" style={{ background: 'rgba(30,41,59,0.5)', borderBottom: '1px solid rgba(99,102,241,0.1)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
            <span>ProPOS</span>
            <span>›</span>
            <span className="capitalize text-white font-medium">{activeView}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
              <span className="text-xs" style={{ color: '#64748b' }}>Firebase Connected</span>
            </div>
            <div className="text-xs" style={{ color: '#64748b' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden flex">
          {activeView === 'pos' && (
            <POSView products={products} onStockUpdate={updateStock} />
          )}
          {activeView === 'orders' && (
            <OrdersView orders={orders} onRefund={refundOrder} />
          )}
          {activeView === 'products' && (
            <ProductsView
              products={products}
              onAdd={addProduct}
              onUpdate={updateProduct}
              onDelete={deleteProduct}
            />
          )}
          {activeView === 'analytics' && (
            <AnalyticsView orders={orders} products={products} />
          )}
          {activeView === 'settings' && (
            <SettingsView />
          )}
        </div>
      </main>
    </div>
  );
}
