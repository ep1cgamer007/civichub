import React, { useState } from 'react';
import { useAuth } from '../AuthContext.tsx';
import { LogIn, UserPlus, Shield, CheckCircle, Droplets, Construction, Zap, Trash2 } from 'lucide-react';

export default function LoginRegister() {
  const { login, register, errorMsg, setErrorMsg } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    category: 'Water'
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const prefill = async (email: string, pass: string) => {
    setIsLoading(true);
    setFormError(null);
    const err = await login(email, pass);
    setIsLoading(false);
    if (err) {
      setFormError(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrorMsg(null);

    if (isLogin) {
      if (!form.email || !form.password) {
        setFormError('Please enter both email and password');
        return;
      }
      setIsLoading(true);
      const err = await login(form.email, form.password);
      setIsLoading(false);
      if (err) {
        setFormError(err);
      }
    } else {
      if (!form.name || !form.email || !form.password) {
        setFormError('Please complete all fields');
        return;
      }
      if (form.password.length < 6) {
        setFormError('Password must be at least 6 characters long');
        return;
      }
      setIsLoading(true);
      const err = await register(
        form.name,
        form.email,
        form.password,
        form.role,
        form.role === 'AGENT' ? form.category : undefined
      );
      setIsLoading(false);
      if (err) {
        setFormError(err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-100px)] gap-6 p-4 md:p-6 font-sans" id="login_container">
      {/* Decorative City Utilities Panel */}
      <div className="lg:col-span-5 bg-white/5 backdrop-blur-xl border border-white/10 text-white p-6 lg:p-10 flex flex-col justify-between rounded-3xl shadow-xl relative overflow-hidden" id="utility_info_panel">
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-indigo-550/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border border-indigo-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span>Easy City Reporting</span>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            CivicHub
          </h1>
          
          <p className="text-slate-300 text-xs lg:text-sm leading-relaxed">
            Report local neighborhood issues (like water leaks or road potholes) and chat directly with department agents resolving them. Clear and simple civic care.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-sky-400">
                <Droplets className="w-4 h-4" />
                <span className="font-semibold text-xs">Water & Sewage</span>
              </div>
              <p className="text-[10px] text-slate-400">Burst mains, leaks, drainage issues</p>
            </div>
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-amber-400">
                <Construction className="w-4 h-4" />
                <span className="font-semibold text-xs">Roads & Streets</span>
              </div>
              <p className="text-[10px] text-slate-400">Potholes, blocked routes, signs</p>
            </div>
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Zap className="w-4 h-4" />
                <span className="font-semibold text-xs">Electricity</span>
              </div>
              <p className="text-[10px] text-slate-400">Flickering streetlights, power faults</p>
            </div>
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Trash2 className="w-4 h-4" />
                <span className="font-semibold text-xs">Waste Mgmt</span>
              </div>
              <p className="text-[10px] text-slate-400">Biohazard, garbage piling, litter</p>
            </div>
          </div>
        </div>

        {/* Demo Fast Logins Block */}
        <div className="mt-8 bg-white/5 border border-white/10 p-4.5 rounded-2xl space-y-3" id="demo_accounts_box">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-[10px] text-indigo-300 tracking-wider uppercase">Sandbox Quick Testing</span>
            <span className="bg-indigo-500/20 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-md text-indigo-200">Pre-seeded</span>
          </div>

          <div className="space-y-2 text-xs">
            <button 
              onClick={() => prefill('john@gmail.com', 'user123')}
              id="quick_auth_citizen"
              className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-550/30 p-2 rounded-xl transition flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">Citizen Profile (John Doe)</p>
                <p className="text-[9px] text-slate-400">File complaints, chat with engineers</p>
              </div>
              <div className="text-[10px] text-slate-350 font-mono bg-slate-900 border border-white/10 px-2 py-0.5 rounded">user123</div>
            </button>
            
            <button 
              onClick={() => prefill('water@complaint.com', 'agent123')}
              id="quick_auth_agent"
              className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-550/30 p-2 rounded-xl transition flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">Water Agent Profile</p>
                <p className="text-[9px] text-slate-400">Review water complaints, update progress</p>
              </div>
              <div className="text-[10px] text-slate-350 font-mono bg-slate-900 border border-white/10 px-2 py-0.5 rounded">agent123</div>
            </button>

            <button 
              onClick={() => prefill('admin@complaint.com', 'admin123')}
              id="quick_auth_admin"
              className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-550/30 p-2 rounded-xl transition flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">System Admin Dashboard</p>
                <p className="text-[9px] text-slate-400">Verify stats, dispatch agents, check load</p>
              </div>
              <div className="text-[10px] text-slate-350 font-mono bg-slate-900 border border-white/10 px-2 py-0.5 rounded">admin123</div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Authentication Form */}
      <div className="lg:col-span-7 flex items-center justify-center p-4 md:p-10" id="auth_portal_panel">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {isLogin ? 'Sign In to CivicHub' : 'Join CivicHub'}
            </h2>
            <p className="text-slate-400 text-xs">
              {isLogin ? 'Sign in below, or select any of the demo profiles on the left to try it out immediately!' : 'Sign up to keep your local neighborhood safe and clean.'}
            </p>
          </div>

          {(formError || errorMsg) && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2" id="auth_error_box">
              <span className="bg-rose-500/20 p-0.5 rounded text-rose-100">⚠️</span>
              <span>{formError || errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="auth_form">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 tracking-wide">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Johnathan Doe"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white/10 transition text-white placeholder-slate-400"
                  id="register_name_input"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 tracking-wide">Email Address</label>
              <input
                type="email"
                placeholder="e.g. john@domain.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white/10 transition text-white placeholder-slate-400"
                id="auth_email_input"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 tracking-wide">Password</label>
              <input
                type="password"
                placeholder={isLogin ? "••••••••" : "Minimum 6 characters"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white/10 transition text-white placeholder-slate-400"
                id="auth_password_input"
                required
              />
            </div>

            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 tracking-wide">System Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition text-white"
                    id="register_role_select"
                  >
                    <option value="USER">Citizen User</option>
                    <option value="AGENT">Department Agent</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>

                {form.role === 'AGENT' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 tracking-wide">Dept Specialty</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition text-white"
                      id="register_category_select"
                    >
                      <option value="Water">Water & Sewage</option>
                      <option value="Roads">Roads & Streets</option>
                      <option value="Electricity">Electricity Dept</option>
                      <option value="Waste Management">Waste Management</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              id="auth_submit_button"
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-400 hover:to-indigo-550 font-extrabold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm disabled:bg-indigo-400 cursor-pointer"
            >
              {isLoading ? (
                <span>Please wait...</span>
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center" id="auth_toggle_actions">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFormError(null);
                setErrorMsg(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
              id="auth_mode_toggle_btn"
            >
              {isLogin ? "Need a civic account? Register here" : "Already registered? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
