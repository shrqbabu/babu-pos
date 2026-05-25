import { useState, type ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { cn } from "../utils/cn";
import {
  IconDashboard, IconPOS, IconBag, IconBox, IconUsers, IconBriefcase,
  IconWarehouse, IconChart, IconSettings, IconLogout, IconSun, IconMoon, IconMenu,
} from "./icons";

export type PageKey =
  | "dashboard" | "pos" | "orders" | "products" | "customers"
  | "employees" | "inventory" | "reports" | "settings";

const NAV: { key: PageKey; label: string; icon: React.FC<{className?:string}>; adminOnly?: boolean }[] = [
  { key: "dashboard", label: "Dashboard", icon: IconDashboard },
  { key: "pos", label: "POS Billing", icon: IconPOS },
  { key: "orders", label: "Orders", icon: IconBag },
  { key: "products", label: "Products", icon: IconBox, adminOnly: true },
  { key: "customers", label: "Customers", icon: IconUsers },
  { key: "employees", label: "Employees", icon: IconBriefcase, adminOnly: true },
  { key: "inventory", label: "Inventory", icon: IconWarehouse, adminOnly: true },
  { key: "reports", label: "Reports", icon: IconChart, adminOnly: true },
  { key: "settings", label: "Settings", icon: IconSettings },
];

export default function Layout({
  page, onNavigate, children,
}: { page: PageKey; onNavigate: (p: PageKey) => void; children: ReactNode }) {
  const { profile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const isAdmin = profile?.role === "admin";

  const Sidebar = (
    <aside className={cn(
      "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform",
      open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-200 dark:border-slate-800">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
          <IconPOS className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-slate-900 dark:text-white tracking-tight">SmartPOS</div>
          <div className="text-[10px] text-slate-500 -mt-0.5">v1.0 · Premium</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.filter(n => !n.adminOnly || isAdmin).map((n) => {
          const Icon = n.icon;
          const active = page === n.key;
          return (
            <button
              key={n.key}
              onClick={() => { onNavigate(n.key); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {n.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500"/>}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
            {profile?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{profile?.name}</div>
            <div className="text-[11px] text-slate-500 capitalize">{profile?.role}</div>
          </div>
          <button onClick={logout} title="Logout" className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 flex items-center justify-center">
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0b1020]">
      {Sidebar}
      {open && <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur sticky top-0 z-20 flex items-center gap-3">
          <button className="lg:hidden h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center" onClick={() => setOpen(true)}>
            <IconMenu className="h-5 w-5"/>
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-slate-900 dark:text-white capitalize">{NAV.find(n => n.key === page)?.label}</h1>
          </div>
          <button
            onClick={toggle}
            className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
