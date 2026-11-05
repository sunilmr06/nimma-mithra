import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { ShieldCheck, Lock, Eye, EyeOff, Sparkles, Mail, KeyRound, ArrowLeft } from 'lucide-react';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { adminLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter administrator email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await adminLogin(email, password);
      toast.success(`Welcome Administrator, ${user.name}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('admin@campuscare.edu');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient glow circles with Admin primary/indigo shade */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-primary/30 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-primary-light flex items-center justify-center shadow-xl shadow-primary/30 mb-3 border border-primary/40">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary-light border border-primary/30 mb-2">
            <Lock className="w-3 h-3" />
            Restricted Admin Portal
          </div>
          <h1 className="text-2xl font-extrabold text-main tracking-tight">
            Administrator <span className="text-primary-light">Access</span>
          </h1>
          <p className="text-xs text-muted mt-1 max-w-xs">
            Campus Operations & Maintenance Management Terminal
          </p>
        </div>

        {/* Demo Account Quick-Fill Pill for Admin */}
        <div className="mb-6 p-3 rounded-xl bg-elevated border border-primary/20">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-light mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Administrator Demo Credentials (1-Click)</span>
          </div>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full px-3 py-2 rounded-lg bg-card hover:bg-primary/20 hover:text-primary-light border border-border text-xs font-semibold text-main transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-primary-light" />
            <span>Dr. Sarah Mitchell (admin@campuscare.edu)</span>
          </button>
        </div>

        {/* Admin Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@campuscare.edu"
                required
                className="w-full bg-elevated border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-main placeholder-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Administrator Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-elevated border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-main placeholder-muted focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-main"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-light hover:to-indigo-500 shadow-lg shadow-primary/25"
          >
            Authenticate Admin Session
          </Button>
        </form>

        {/* Return to standard login */}
        <div className="mt-6 pt-4 border-t border-border/80 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-cyan transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Not an administrator? <strong>Student / Staff Login</strong></span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
