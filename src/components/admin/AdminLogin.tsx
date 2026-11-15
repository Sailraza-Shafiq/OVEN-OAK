import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const AdminLogin: React.FC = () => {
  const { loginAdmin, setIsAdminView, adminPasswordConfigured } = useCart();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your admin password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const result = await loginAdmin(password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Invalid admin password.');
    }
  };

  const handleReturnToStore = () => {
    setIsAdminView(false);
    if (window.location.pathname.includes('/admin')) {
      window.history.pushState({}, '', '/');
    }
    if (window.location.hash.includes('admin')) {
      window.location.hash = '';
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#3B241C] flex flex-col justify-between font-sans selection:bg-[#3B241C] selection:text-white">
      {/* Top minimal bar */}
      <div className="border-b border-[#3B241C]/15 py-3.5 px-4 sm:px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg sm:text-xl font-bold tracking-widest text-[#3B241C]">
            OVEN &amp; OAK
          </span>
          <span className="text-[10px] sm:text-xs uppercase font-mono tracking-widest text-[#3B241C]/60 pl-2 border-l border-[#3B241C]/20">
            Control Portal
          </span>
        </div>

        <button
          onClick={handleReturnToStore}
          className="text-xs uppercase font-semibold tracking-wider text-[#3B241C]/80 hover:text-[#3B241C] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Storefront</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md border border-[#3B241C]/20 bg-white p-5 sm:p-8 shadow-xl space-y-6">
          
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 mx-auto bg-[#3B241C] text-white flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#3B241C]/70">
              Restricted Area
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#3B241C]">
              Bakery Administration
            </h1>
            <p className="text-xs text-[#3B241C]/75 font-sans max-w-xs mx-auto">
              Please enter your owner password to access product pricing, menu catalogs, and customer orders.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#3B241C] mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your admin password"
                  autoFocus
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 text-sm border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C] bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3B241C]/50 hover:text-[#3B241C] p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-xs text-[#3B241C] font-semibold mt-1.5 bg-[#3B241C]/10 p-2 border border-[#3B241C]/20">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#3B241C] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#3B241C]/90 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Verifying Session...' : 'Authenticate Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Server Auth Guidance Box */}
          <div className="p-4 bg-[#3B241C]/5 border border-[#3B241C]/15 text-xs text-[#3B241C]/80 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#3B241C]">
              <Shield className="w-3.5 h-3.5" />
              <span>Protected Server Session</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#3B241C]/75">
              {adminPasswordConfigured
                ? 'Password verification runs securely on the server and issues an expiring HttpOnly session.'
                : 'Server configuration needed: set the ADMIN_PASSWORD environment variable on the server to unlock access.'}
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#3B241C]/10 py-4 text-center text-xs text-[#3B241C]/60 font-mono">
        OVEN &amp; OAK BAKERY INC. · INTERNAL MANAGEMENT CONSOLE
      </div>
    </div>
  );
};
