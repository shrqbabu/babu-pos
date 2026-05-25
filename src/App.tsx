import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import Layout, { type PageKey } from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import { Spinner } from "./components/ui";
import ErrorBoundary from "./components/ErrorBoundary";

function Shell() {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState<PageKey>(() => {
    const h = window.location.hash.replace("#", "") as PageKey;
    return h || "dashboard";
  });

  useEffect(() => { window.location.hash = page; }, [page]);
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "") as PageKey;
      if (h) setPage(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1020]">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }
  if (!user || !profile) return <Login />;

  // Role guard for admin-only pages
  const adminOnly: PageKey[] = ["products", "employees", "inventory", "reports"];
  const effectivePage = adminOnly.includes(page) && profile.role !== "admin" ? "dashboard" : page;

  const render = () => {
    switch (effectivePage) {
      case "dashboard": return <Dashboard />;
      case "pos": return <POS />;
      case "orders": return <Orders />;
      case "products": return <Products />;
      case "customers": return <Customers />;
      case "employees": return <Employees />;
      case "inventory": return <Inventory />;
      case "reports": return <Reports />;
      case "settings": return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout page={effectivePage} onNavigate={setPage}>
      <ErrorBoundary key={effectivePage}>{render()}</ErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
