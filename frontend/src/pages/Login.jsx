import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, ArrowRight, Lock, Mail, Shield, Briefcase, UserCheck, Check, Sparkles } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSelectDemo = (roleEmail, rolePass, roleName) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setActiveRole(roleName);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // handled by auth context toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative Ambient Grid & Lighting */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(2, 132, 199, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(2, 132, 199, 0.08) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="absolute -top-36 -right-24 w-96 h-96 rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-indigo-100/60 blur-3xl pointer-events-none" />

      {/* Main Centered Content */}
      <div className="w-full max-w-[430px] relative z-10">
        {/* Brand Logo & Tagline */}
        <div className="text-center mb-6">
          <img
            src="/autoflow.png"
            alt="AutoFlow"
            className="h-20 sm:h-24 w-auto max-w-[300px] sm:max-w-[360px] mx-auto object-contain transition-transform duration-200 hover:scale-[1.02]"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mt-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs">
            <Sparkles className="w-3 h-3 text-sky-500" /> Smart Vehicle Service Management
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative overflow-hidden">
          {/* Top Multi-Gradient Accent Bar */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />

          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Sign In to Workspace</h2>
            <p className="text-xs text-slate-500 mt-1">Enter your account credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-600" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setActiveRole(null);
                }}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 shadow-2xs transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-sky-600" /> Password
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Demo: password123</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 shadow-2xs transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-sky-600/25 hover:shadow-sky-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* 1-Click Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 text-center flex items-center justify-center gap-1">
              <span>Quick 1-Click Demo Credentials</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemo('admin@autoflow.com', 'password123', 'admin')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                  activeRole === 'admin'
                    ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/30 font-bold shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100/80 text-amber-800 border-amber-200/90 shadow-2xs'
                }`}
              >
                {activeRole === 'admin' ? <Check className="w-3 h-3 text-amber-700" /> : <Shield className="w-3 h-3 text-amber-600" />}
                Admin
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo('advisor@autoflow.com', 'password123', 'advisor')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                  activeRole === 'advisor'
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-400 ring-2 ring-indigo-400/30 font-bold shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-800 border-indigo-200/90 shadow-2xs'
                }`}
              >
                {activeRole === 'advisor' ? <Check className="w-3 h-3 text-indigo-700" /> : <Briefcase className="w-3 h-3 text-indigo-600" />}
                Advisor
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo('mechanic@autoflow.com', 'password123', 'mechanic')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                  activeRole === 'mechanic'
                    ? 'bg-purple-100 text-purple-900 border-purple-400 ring-2 ring-purple-400/30 font-bold shadow-xs'
                    : 'bg-purple-50 hover:bg-purple-100/80 text-purple-800 border-purple-200/90 shadow-2xs'
                }`}
              >
                {activeRole === 'mechanic' ? <Check className="w-3 h-3 text-purple-700" /> : <Wrench className="w-3 h-3 text-purple-600" />}
                Mechanic
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo('amit@autoflow.com', 'password123', 'customer')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                  activeRole === 'customer'
                    ? 'bg-sky-100 text-sky-900 border-sky-400 ring-2 ring-sky-400/30 font-bold shadow-xs'
                    : 'bg-sky-50 hover:bg-sky-100/80 text-sky-800 border-sky-200/90 shadow-2xs'
                }`}
              >
                {activeRole === 'customer' ? <Check className="w-3 h-3 text-sky-700" /> : <UserCheck className="w-3 h-3 text-sky-600" />}
                Customer
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-sky-600 hover:text-sky-700 hover:underline font-bold">
              Create Customer Account
            </Link>
          </div>
        </div>

        {/* Subtle footer label */}
        <p className="text-[11px] text-slate-400 text-center mt-4 font-medium">
          AutoFlow SaaS • Production Demo Ready
        </p>
      </div>
    </div>
  );
};

export default Login;
