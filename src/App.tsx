// SmartPOS - Main Application Entry Point
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/pos" element={
              <ProtectedRoute>
                <POS />
              </ProtectedRoute>
            } />

            <Route path="/products" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <Products />
              </ProtectedRoute>
            } />

            <Route path="/categories" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <Categories />
              </ProtectedRoute>
            } />

            <Route path="/customers" element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } />

            <Route path="/employees" element={
              <ProtectedRoute requiredRole={['admin']}>
                <Employees />
              </ProtectedRoute>
            } />

            <Route path="/inventory" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <Inventory />
              </ProtectedRoute>
            } />

            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <Reports />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute requiredRole={['admin']}>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: 'white' },
                style: {
                  background: '#f0fdf4',
                  color: '#065f46',
                  border: '1px solid #bbf7d0',
                },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: 'white' },
                style: {
                  background: '#fef2f2',
                  color: '#7f1d1d',
                  border: '1px solid #fecaca',
                },
              },
            }}
          />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
