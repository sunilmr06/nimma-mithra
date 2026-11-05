import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Rss, 
  Users, 
  BarChart3, 
  CheckSquare, 
  Shield,
  LifeBuoy,
  Activity,
  MessageSquareHeart,
  User,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { role, logout, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Logged out.');
    navigate('/login');
  };

  const studentLinks = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/tracker', label: 'Issue Tracker', icon: Activity, badge: 'Live' },
    { to: '/student/feed', label: 'Public Feed', icon: Rss },
    { to: '/student/feedback', label: 'Public Feedback', icon: MessageSquareHeart },
    { to: '/student/report', label: 'Report New Issue', icon: PlusCircle, highlight: true },
    { to: '/student/my-complaints', label: 'My Complaints', icon: FileText },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/complaints', label: 'Complaint Queue', icon: FileText },
    { to: '/student/feed', label: 'Public Feed', icon: Rss },
    { to: '/student/feedback', label: 'Public Feedback', icon: MessageSquareHeart },
    { to: '/admin/staff', label: 'Staff Management', icon: Users },
    { to: '/admin/analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { to: '/admin/users', label: 'User Directory', icon: Shield },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  const staffLinks = [
    { to: '/staff', label: 'Dashboard / Tasks', icon: CheckSquare },
    { to: '/student/feed', label: 'Public Feed', icon: Rss },
    { to: '/student/feedback', label: 'Public Feedback', icon: MessageSquareHeart },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  let links = studentLinks;
  if (role === 'admin') links = adminLinks;
  if (role === 'staff') links = staffLinks;

  return (
    <aside className="w-64 bg-sidebar border-r border-border min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div>
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
          Navigation Menu
        </div>

        <nav className="flex flex-col gap-1 mt-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/student' || link.to === '/admin' || link.to === '/staff'}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-primary/20 text-white border border-primary/40 shadow-sm font-semibold'
                      : link.highlight
                      ? 'bg-primary/10 text-primary-light hover:bg-primary/20 border border-primary/20'
                      : 'text-muted hover:text-main hover:bg-card'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${link.highlight ? 'text-primary-light' : ''}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan/20 text-cyan border border-cyan/30">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box + Logout Button */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-card border border-border text-xs">
          <div className="flex items-center gap-2 text-cyan font-bold">
            <LifeBuoy className="w-4 h-4 text-cyan" />
            <span>Nimma Mithra</span>
          </div>
          <p className="text-[11px] text-muted mt-1 leading-relaxed">
            Smart Campus Maintenance, Live Tracking & Transparent Feedback.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-critical/10 text-critical border border-critical/30 hover:bg-critical hover:text-white transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
