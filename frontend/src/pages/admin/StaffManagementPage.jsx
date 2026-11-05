import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { 
  Users, 
  UserPlus, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Phone, 
  Building 
} from 'lucide-react';

const StaffManagementPage = () => {
  const toast = useToast();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New staff modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    specialization: 'Electrical & Power Systems',
    department: 'Maintenance & Facilities',
    phone: '',
  });
  const [adding, setAdding] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await adminService.getStaffList();
      setStaffList(res.staff || []);
    } catch (err) {
      toast.error('Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      toast.warning('Please fill in required fields.');
      return;
    }

    setAdding(true);
    try {
      await adminService.createStaff(newStaff);
      toast.success(`Staff account for ${newStaff.name} created!`);
      setShowAddModal(false);
      setNewStaff({
        name: '',
        email: '',
        password: '',
        specialization: 'Electrical & Power Systems',
        department: 'Maintenance & Facilities',
        phone: '',
      });
      fetchStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to create staff account.');
    } finally {
      setAdding(false);
    }
  };

  const specializations = [
    'Electrical & Power Systems',
    'Plumbing & Sanitation',
    'Network & Projector Hardware',
    'Classroom Furniture & Infrastructure',
    'HVAC & Air Conditioning',
    'General Campus Maintenance',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-main tracking-tight">Staff Management & Workload</h2>
          <p className="text-xs text-muted mt-1">
            Monitor technician specializations, active workloads, and provision maintenance accounts.
          </p>
        </div>

        <Button
          variant="cyan"
          icon={UserPlus}
          onClick={() => setShowAddModal(true)}
        >
          Add Staff Member
        </Button>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted text-sm">Loading staff members...</div>
      ) : staffList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted text-xs">
          No staff members registered.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((s) => (
            <Card key={s.staff_id} className="space-y-3.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan/15 text-cyan border border-cyan/30 flex items-center justify-center font-bold text-sm">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-main leading-tight">{s.name}</h4>
                    <span className="text-[11px] text-cyan-light font-medium block">
                      {s.specialization}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    s.is_available
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {s.is_available ? 'Available' : 'High Load'}
                </span>
              </div>

              {/* Workload Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-center">
                <div className="p-2 rounded-lg bg-elevated border border-border/80">
                  <span className="text-base font-bold text-main block">{s.active_tasks_count}</span>
                  <span className="text-[10px] text-muted uppercase tracking-wider">Active Tasks</span>
                </div>
                <div className="p-2 rounded-lg bg-elevated border border-border/80">
                  <span className="text-base font-bold text-success block">{s.completed_tasks_count}</span>
                  <span className="text-[10px] text-muted uppercase tracking-wider">Completed</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-xs text-muted pt-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="truncate">{s.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span>{s.department}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Provision Maintenance Staff Account"
        subtitle="Create an authorized staff account for complaint assignment."
      >
        <form onSubmit={handleCreateStaff} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs text-main focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Staff Email *</label>
            <input
              type="email"
              required
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              placeholder="staff@campuscare.edu"
              className="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs text-main focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Initial Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newStaff.password}
              onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs text-main focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Specialization *</label>
            <select
              value={newStaff.specialization}
              onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })}
              className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-primary"
            >
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Phone Number</label>
            <input
              type="tel"
              value={newStaff.phone}
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs text-main focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="cyan" size="sm" loading={adding}>
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffManagementPage;
