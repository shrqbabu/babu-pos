import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Input, Label } from "../components/ui";
import { IconPOS } from "../components/icons";

export default function Login() {
  const { login, register } = useAuth();
  const { push } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "cashier">("admin");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        push("Welcome back!", "success");
      } else {
        await register(email.trim(), password, name.trim(), role);
        push("Account created", "success");
      }
    } catch (err: any) {
      push(err?.message || "Authentication failed", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0b1020]">
      {/* Branding panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 flex-col justify-between text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-white/20 blur-3xl"/>
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-400/30 blur-3xl"/>
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <IconPOS className="h-6 w-6"/>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">SmartPOS</div>
              <div className="text-xs text-white/70">Premium Point of Sale</div>
            </div>
          </div>
        </div>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold tracking-tight leading-tight">
            Run your store<br />smarter, faster, better.
          </h2>
          <p className="text-white/80 max-w-md">
            Complete POS, inventory, customers, employees and analytics — all in one beautifully designed dashboard, powered by Firebase.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md pt-4">
            {[
              { v: "10k+", l: "Orders" },
              { v: "99.9%", l: "Uptime" },
              { v: "<200ms", l: "Sync" },
            ].map((s) => (
              <div key={s.l} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <div className="text-lg font-bold">{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/60">© 2026 SmartPOS — All rights reserved.</div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
              <IconPOS className="h-6 w-6"/>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {mode === "login" ? "Sign in to SmartPOS" : "Create your account"}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {mode === "login" ? "Enter your credentials to access the dashboard." : "First account is automatically promoted to admin."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
              </div>
            )}
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@store.com" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            {mode === "signup" && (
              <div>
                <Label>Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["admin","cashier"] as const).map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`h-10 rounded-lg border text-sm font-medium capitalize transition-colors ${
                        role === r
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}>{r}</button>
                  ))}
                </div>
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === "login" ? "New to SmartPOS?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-semibold text-indigo-600 hover:text-indigo-500">
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
