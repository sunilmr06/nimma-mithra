import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Globe, 
  Users, 
  BarChart3, 
  CheckSquare, 
  Wrench,
  Shield,
  LifeBuoy
} from 'lucide-react';

const Sidebar = () => {
  const { role } = useAuth();

  const studentLinks = [
    { to: '/student', label: 'Overview', icon: LayoutDashboard },
    { to: '/student/report', label: 'Report New Issue', icon: PlusCircle, highlight: true },
    { to: '/student/my-complaints', label: 'My Complaints', icon: FileText },
    { to: '/student/campus-feed', label: 'Campus Feed', icon: Globe },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard Overview', icon: LayoutDashboard },
    { to: '/admin/complaints', label: 'Complaint Queue', icon: FileText },
    { to: '/admin/staff', label: 'Staff Management', icon: Users },
    { to: '/admin/analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { to: '/admin/users', label: 'User Directory', icon: Shield },
  ];

  const staffLinks = [
    { to: '/staff', label: 'My Assigned Tasks', icon: CheckSquare },
  ];

  let links = studentLinks;
  if (role === 'admin') links = adminLinks;
  if (role === 'staff') links = staffLinks;

  return (
    <aside className="w-64 bg-sidebar border-r border-border min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div>
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted">
          Navigation
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
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-primary/20 text-white border border-primary/40 shadow-sm'
                      : link.highlight
                      ? 'bg-primary/10 text-primary-light hover:bg-primary/20 border border-primary/20'
                      : 'text-muted hover:text-main hover:bg-card'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${link.highlight ? 'text-primary-light' : ''}`} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-xl bg-card border border-border text-xs">
        <div className="flex items-center gap-2 text-cyan font-semibold">
          <LifeBuoy className="w-4 h-4" />
          <span>CampusCare MVP</span>
        </div>
        <p className="text-[11px] text-muted mt-1 leading-relaxed">
          Intelligent duplicate detection & explainable priority scoring engine.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
