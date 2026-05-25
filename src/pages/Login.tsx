import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Mail, Lock, AlertCircle, ChevronRight } from 'lucide-react';
import { signIn } from '../firebase/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@smartpos.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
  // Try Firebase auth first
  await signIn(email, password);

  toast.success('Welcome back!');
  navigate('/dashboard');

} catch (err: any) {
  console.error(err);
  setError('Invalid email or password');
} finally {
  setLoading(false);
}
    
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SmartPOS</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Modern Point of Sale
            <span className="block text-indigo-400">for Smart Business</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-md">
            Complete POS solution with inventory management, customer tracking, 
            sales analytics, and real-time Firebase sync.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { emoji: '📊', title: 'Real-time Analytics', desc: 'Live sales dashboard' },
              { emoji: '🛒', title: 'Fast Billing', desc: 'Barcode & search support' },
              { emoji: '👥', title: 'Customer Management', desc: 'Loyalty points & history' },
              { emoji: '📦', title: 'Inventory Control', desc: 'Auto stock updates' },
            ].map((feature) => (
              <div key={feature.title} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <span className="text-2xl">{feature.emoji}</span>
                <h3 className="text-sm font-semibold text-white mt-2">{feature.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-500 text-sm">
          © 2024 SmartPOS. Powered by Firebase & React.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SmartPOS</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-slate-400 text-sm">Sign in to your SmartPOS account</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@smartpos.com"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-10 py-3 text-white placeholder:text-slate-500 text-sm
                      focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-10 py-3 text-white placeholder:text-slate-500 text-sm
                      focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium text-sm
                  flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50
                  disabled:cursor-not-allowed active:scale-98 shadow-lg shadow-indigo-500/25"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-slate-400 font-medium mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Demo Credentials (Click to use)
              </p>
              <div className="space-y-2">
                {DEMO_CREDENTIALS.map((cred) => (
                  <button
                    key={cred.email}
                    type="button"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.password);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10
                      border border-white/10 transition-all text-left group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white">{cred.role}</span>
                      <span className="text-xs text-slate-400 ml-2">{cred.email}</span>
                    </div>
                    <span className="text-xs text-slate-500 group-hover:text-indigo-400 transition-colors">
                      {cred.password}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-4">
            Demo mode active • No real Firebase connection required
          </p>
        </div>
      </div>
    </div>
  );
}
