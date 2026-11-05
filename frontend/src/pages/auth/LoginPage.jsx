import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { ShieldCheck, Eye, EyeOff, Sparkles, Wrench, GraduationCap, Lock, Mail } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      // Redirect based on role
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else navigate('/student');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient glow circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-cyan flex items-center justify-center shadow-xl shadow-primary/25 mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-main tracking-tight">
            Campus<span className="text-cyan">Care</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Smart Campus Maintenance & Intelligent Complaint Resolution
          </p>
        </div>

        {/* Demo Account Quick-Fill Pills */}
        <div className="mb-6 p-3 rounded-xl bg-elevated border border-border/80">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan" />
            <span>Instant Demo Fill (1-Click)</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@campuscare.edu', 'Admin@123')}
              className="px-2 py-1.5 rounded-lg bg-card hover:bg-primary/20 hover:text-primary-light border border-border text-[11px] font-semibold text-main transition-colors flex items-center justify-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-primary-light" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('rajesh.electrician@campuscare.edu', 'Staff@123')}
              className="px-2 py-1.5 rounded-lg bg-card hover:bg-cyan/20 hover:text-cyan-light border border-border text-[11px] font-semibold text-main transition-colors flex items-center justify-center gap-1"
            >
              <Wrench className="w-3 h-3 text-cyan" />
              Staff
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('alex.student@campuscare.edu', 'Student@123')}
              className="px-2 py-1.5 rounded-lg bg-card hover:bg-emerald-500/20 hover:text-emerald-300 border border-border text-[11px] font-semibold text-main transition-colors flex items-center justify-center gap-1"
            >
              <GraduationCap className="w-3 h-3 text-emerald-400" />
              Student
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campuscare.edu"
                required
                className="w-full bg-elevated border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-main placeholder-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Password
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
            className="w-full mt-2"
          >
            Sign In to CampusCare
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-4 border-t border-border/80 text-center">
          <p className="text-xs text-muted">
            New student?{' '}
            <Link to="/register" className="text-cyan font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
