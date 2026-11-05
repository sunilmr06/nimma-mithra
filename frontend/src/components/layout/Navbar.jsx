import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Sparkles, 
  ChevronDown,
  Wrench,
  GraduationCap,
  Activity,
  Rss,
  MessageSquareHeart,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, role, logout, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDemoSwitch = async (email, pass, label) => {
    try {
      await login(email, pass);
      toast.success(`Switched session to ${label}`);
      setDemoMenuOpen(false);
    } catch (e) {
      toast.error('Failed to switch demo account.');
    }
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    toast.info('Logged out successfully.');
    navigate('/login');
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
    <header className="sticky top-0 z-30 h-16 bg-sidebar/90 backdrop-blur-md border-b border-border px-4 lg:px-8 flex items-center justify-between">
      {/* Left side: Nimma Mithra Brand */}
      <div className="flex items-center gap-6">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-indigo-600 to-cyan flex items-center justify-center shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-main flex items-center gap-1.5">
              Nimma <span className="text-cyan">Mithra</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-elevated border border-border text-primary-light">
                ನಿಮ್ಮ ಮಿತ್ರ
              </span>
            </span>
            <span className="text-[10px] text-muted hidden sm:inline">Smart Campus Maintenance & Support</span>
          </div>
        </NavLink>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink
            to={role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/student'}
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary-light border border-primary/30 font-semibold'
                  : 'text-muted hover:text-main hover:bg-card'
              }`
            }
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/student/tracker"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary-light border border-primary/30 font-semibold'
                  : 'text-muted hover:text-main hover:bg-card'
              }`
            }
          >
            <Activity className="w-3.5 h-3.5 text-cyan" />
            <span>Issue Tracker</span>
          </NavLink>

          <NavLink
            to="/student/feed"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary-light border border-primary/30 font-semibold'
                  : 'text-muted hover:text-main hover:bg-card'
              }`
            }
          >
            <Rss className="w-3.5 h-3.5 text-indigo-400" />
            <span>Public Feed</span>
          </NavLink>

          <NavLink
            to="/student/feedback"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary-light border border-primary/30 font-semibold'
                  : 'text-muted hover:text-main hover:bg-card'
              }`
            }
          >
            <MessageSquareHeart className="w-3.5 h-3.5 text-emerald-400" />
            <span>Public Feedback</span>
          </NavLink>
        </nav>
      </div>

      {/* Right side: Demo Switcher + Role + Profile */}
      <div className="flex items-center gap-3">
        {/* Instant Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setDemoMenuOpen(!demoMenuOpen)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-elevated border border-border hover:border-slate-500 text-main transition-colors"
            title="Switch demo role instantly"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan" />
            <span className="hidden sm:inline">Role Switcher</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted" />
          </button>

          {demoMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-elevated border border-border rounded-xl shadow-2xl p-2 z-50">
              <p className="text-[11px] font-semibold text-muted px-2.5 py-1 uppercase tracking-wider">
                Instant Role Switcher
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
                  onClick={() => handleDemoSwitch('alex.student@campuscare.edu', 'Student@123', 'Student Alex')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-card text-left transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-main">Student Alex (CS)</p>
                    <p className="text-[11px] text-muted">alex.student@campuscare.edu</p>
                  </div>
                </button>
                <button
                  onClick={() => handleDemoSwitch('priya.student@campuscare.edu', 'Student@123', 'Student Priya')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg hover:bg-card text-left transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-main">Student Priya (Mech)</p>
                    <p className="text-[11px] text-muted">priya.student@campuscare.edu</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Role Badge */}
        <div className="hidden md:flex">{getRoleBadge()}</div>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-elevated transition-colors"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover border border-cyan/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-cyan font-bold text-xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
            )}
            <div className="text-left hidden lg:block">
              <p className="text-xs font-semibold text-main leading-tight">{user?.name || 'User'}</p>
              <p className="text-[11px] text-muted">{user?.department || user?.email}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted hidden sm:inline" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-elevated border border-border rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-border/60 mb-1">
                <p className="text-xs font-semibold text-main">{user?.name}</p>
                <p className="text-[11px] text-muted truncate">{user?.email}</p>
                <p className="text-[10px] text-primary-light font-bold mt-1 uppercase tracking-wider">{role} Account</p>
              </div>

              <NavLink
                to="/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-card text-main transition-colors"
              >
                <UserIcon className="w-4 h-4 text-cyan" />
                <span>My Profile & Settings</span>
              </NavLink>

              <NavLink
                to="/student/tracker"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-card text-main transition-colors"
              >
                <Activity className="w-4 h-4 text-primary-light" />
                <span>My Issue Tracker</span>
              </NavLink>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-critical hover:bg-card rounded-lg transition-colors font-medium text-left mt-1 border-t border-border/60"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg bg-elevated text-muted hover:text-main"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-sidebar border-b border-border p-4 z-40 space-y-2">
          <NavLink
            to={role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/student'}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-main hover:bg-elevated"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/student/tracker"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-main hover:bg-elevated"
          >
            <Activity className="w-4 h-4 text-cyan" />
            <span>Issue Tracker</span>
          </NavLink>
          <NavLink
            to="/student/feed"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-main hover:bg-elevated"
          >
            <Rss className="w-4 h-4 text-indigo-400" />
            <span>Public Feed</span>
          </NavLink>
          <NavLink
            to="/student/feedback"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-main hover:bg-elevated"
          >
            <MessageSquareHeart className="w-4 h-4 text-emerald-400" />
            <span>Public Feedback</span>
          </NavLink>
          <NavLink
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-main hover:bg-elevated"
          >
            <UserIcon className="w-4 h-4 text-cyan" />
            <span>Profile</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-critical hover:bg-elevated text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
