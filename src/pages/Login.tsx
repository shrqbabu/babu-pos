// Login Page for SmartPOS
import { useState } from 'react';
import { Eye, EyeOff, Store, Lock, Mail, Loader2, AlertCircle, Info } from 'lucide-react';
import { signIn, createDemoAdmin } from '../firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creatingDemo, setCreatingDemo] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-email': 'Invalid email address',
        'auth/too-many-requests': 'Too many attempts. Try again later',
        'auth/invalid-credential': 'Invalid email or password',
      };
      setError(messages[err.code] || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemo = async () => {
    setCreatingDemo(true);
    try {
      const result = await createDemoAdmin();
      if (result) {
        // Also create a cashier demo user
        try {
          const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
          const { auth } = await import('../firebase/config');
          const cashierCred = await createUserWithEmailAndPassword(auth, 'cashier@smartpos.com', 'cashier123456');
          await updateProfile(cashierCred.user, { displayName: 'Demo Cashier' });
          await setDoc(doc(db, 'users', cashierCred.user.uid), {
            uid: cashierCred.user.uid,
            email: 'cashier@smartpos.com',
            displayName: 'Demo Cashier',
            role: 'cashier',
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch { /* cashier might exist already */ }
        toast.success('Demo accounts created! Login with admin@smartpos.com / admin123456');
        setEmail('admin@smartpos.com');
        setPassword('admin123456');
      } else {
        toast('Demo accounts already exist. Use admin@smartpos.com / admin123456', { icon: 'ℹ️' });
        setEmail('admin@smartpos.com');
        setPassword('admin123456');
      }
    } catch (err) {
      toast.error('Failed to create demo accounts');
    } finally {
      setCreatingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Store className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">SmartPOS</h1>
          <p className="text-indigo-200 text-xl mb-8">Modern Point of Sale System</p>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              '🛒 POS Billing', '📦 Inventory Management',
              '👥 Customer CRM', '📊 Analytics Dashboard',
              '🏪 Multi-Store', '🔐 Role-Based Access',
            ].map((feature) => (
              <div key={feature} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                <p className="text-white text-sm font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white font-bold text-2xl">SmartPOS</h1>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-white font-bold text-2xl mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to your SmartPOS account</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@smartpos.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Demo Account Setup */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 text-xs font-medium mb-1">First time setup?</p>
                  <p className="text-gray-500 text-xs mb-3">Create demo accounts to explore SmartPOS</p>
                  <button
                    onClick={handleCreateDemo}
                    disabled={creatingDemo}
                    className="bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    {creatingDemo ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {creatingDemo ? 'Creating...' : 'Create Demo Accounts'}
                  </button>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-600 text-xs">👤 Admin: admin@smartpos.com / admin123456</p>
                    <p className="text-gray-600 text-xs">👤 Cashier: cashier@smartpos.com / cashier123456</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
