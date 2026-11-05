import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Sparkles, 
  ChevronDown,
  Building,
  Wrench,
  GraduationCap
} from 'lucide-react';

const Navbar = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const { user, role, logout, login } = useAuth();
  const toast = useToast();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleDemoSwitch = async (email, pass, label) => {
    try {
      await login(email, pass);
      toast.success(`Switched session to ${label}`);
      setDemoMenuOpen(false);
    } catch (e) {
      toast.error('Failed to switch demo account.');
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary-light border border-primary/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan/20 text-cyan-light border border-cyan/30">
            <Wrench className="w-3.5 h-3.5" />
            Maintenance Staff
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <GraduationCap className="w-3.5 h-3.5" />
            Student
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-sidebar/80 backdrop-blur-md border-b border-border px-4 lg:px-8 flex items-center justify-between">
      {/* Left side: CampusCare Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-cyan flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-tight text-main flex items-center gap-1.5">
            Campus<span className="text-cyan">Care</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-elevated border border-border text-muted">
              v1.0
            </span>
          </span>
          <span className="text-[11px] text-muted hidden sm:inline">Smart Campus Maintenance</span>
        </div>
      </div>

      {/* Right side: Demo Switcher + Role + User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setDemoMenuOpen(!demoMenuOpen)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-elevated border border-border hover:border-slate-500 text-main transition-colors"
            title="Switch demo role instantly"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan" />
            <span className="hidden sm:inline">Demo Switcher</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted" />
          </button>

          {demoMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-elevated border border-border rounded-xl shadow-2xl p-2 z-50">
              <p className="text-[11px] font-semibold text-muted px-2.5 py-1 uppercase tracking-wider">
                Instant Role Switching
              </p>
              <div className="flex flex-col gap-1 mt-1">
                <button
                  onClick={() => handleDemoSwitch('admin@campuscare.edu', 'Admin@123', 'Administrator')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-card text-left transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-primary-light" />
                  <div>
                    <p className="font-semibold text-main">Administrator</p>
                    <p className="text-[11px] text-muted">Dr. Sarah Mitchell</p>
                  </div>
                </button>
                <button
                  onClick={() => handleDemoSwitch('rajesh.electrician@campuscare.edu', 'Staff@123', 'Rajesh (Electrical Staff)')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-card text-left transition-colors"
                >
                  <Wrench className="w-4 h-4 text-cyan" />
                  <div>
                    <p className="font-semibold text-main">Staff (Electrical)</p>
                    <p className="text-[11px] text-muted">Rajesh Kumar</p>
                  </div>
                </button>
                <button
                  onClick={() => handleDemoSwitch('suresh.plumber@campuscare.edu', 'Staff@123', 'Suresh (Plumber Staff)')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-card text-left transition-colors"
                >
                  <Wrench className="w-4 h-4 text-cyan" />
                  <div>
                    <p className="font-semibold text-main">Staff (Plumbing)</p>
                    <p className="text-[11px] text-muted">Suresh Sharma</p>
                  </div>
                </button>
                <button
                  onClick={() => handleDemoSwitch('alex.student@campuscare.edu', 'Student@123', 'Student A (Alex)')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-card text-left transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-main">Student A (Reporter)</p>
                    <p className="text-[11px] text-muted">Alex Mercer (CS)</p>
                  </div>
                </button>
                <button
                  onClick={() => handleDemoSwitch('priya.student@campuscare.edu', 'Student@123', 'Student B (Priya)')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-card text-left transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-main">Student B (Duplicate / Supporter)</p>
                    <p className="text-[11px] text-muted">Priya Patel (Mech)</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Role Badge */}
        <div className="hidden md:flex">{getRoleBadge()}</div>

        {/* User Profile & Logout */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-elevated transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-primary-light font-bold text-xs">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-semibold text-main leading-tight">{user?.name || 'User'}</p>
              <p className="text-[11px] text-muted">{user?.email}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted hidden sm:inline" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-elevated border border-border rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-border/60 mb-1">
                <p className="text-xs font-semibold text-main">{user?.name}</p>
                <p className="text-[11px] text-muted truncate">{user?.email}</p>
                <p className="text-[11px] text-primary-light font-medium mt-1 capitalize">{role} Account</p>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                  toast.info('Logged out.');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-critical hover:bg-card rounded-lg transition-colors font-medium text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
