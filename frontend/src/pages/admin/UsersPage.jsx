import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import { Shield, GraduationCap, Wrench, Search, Mail, Phone, Building } from 'lucide-react';

const UsersPage = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(roleFilter !== 'all' ? roleFilter : '');
      setUsers(res.users || []);
    } catch (err) {
      toast.error('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-primary-light" />;
      case 'staff':
        return <Wrench className="w-4 h-4 text-cyan" />;
      default:
        return <GraduationCap className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-main tracking-tight">User Directory</h2>
        <p className="text-xs text-muted mt-1">
          Registered students, maintenance technicians, and system administrators.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, department..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-main placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-primary w-full sm:w-auto"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="staff">Staff Members</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-elevated/70 border-b border-border text-muted uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department / Specialization</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">Loading users...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">No users found.</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-elevated/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center font-bold text-xs text-main">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-main">{u.name}</p>
                          <p className="text-[11px] text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 capitalize font-medium">
                        {getRoleIcon(u.role)}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {u.specialization || u.department || '—'}
                    </td>
                    <td className="py-3 px-4 text-muted font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-success bg-success/15 px-2 py-0.5 rounded-full border border-success/30">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default UsersPage;
