import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { notificationService } from '../../services/notificationService';
import { 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  ChevronDown,
  Wrench,
  GraduationCap,
  Activity,
  Rss,
  MessageSquareHeart,
  LayoutDashboard,
  Menu,
  X,
  Bell,
  CheckCheck
} from 'lucide-react';

const Navbar = () => {
  const { user, role, logout, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNotifClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifOpen(false);
      if (notif.complaint_id) {
        navigate(`/student/complaints/${notif.complaint_id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch (e) {
      toast.error('Failed to mark notifications as read.');
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
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

      {/* Right side: Notifications Bell + Role Badge + Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl bg-elevated border border-border hover:border-slate-500 text-main transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-cyan" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-extrabold text-white flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan" />
                  <span className="text-xs font-bold text-main">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] text-cyan hover:underline font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-8 text-center text-muted text-xs">
                  <Bell className="w-6 h-6 text-muted/50 mx-auto mb-2" />
                  <span>No notifications yet</span>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-1.5 divide-y divide-border/40">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`pt-2 first:pt-0 p-2 rounded-xl cursor-pointer transition-colors ${
                        !n.is_read
                          ? 'bg-primary/10 border-l-2 border-cyan text-main'
                          : 'hover:bg-elevated/60 text-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-xs font-semibold ${!n.is_read ? 'text-cyan-light' : 'text-main'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-muted shrink-0">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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
