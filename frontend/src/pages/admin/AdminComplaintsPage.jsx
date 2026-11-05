import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  UserPlus, 
  Edit3, 
  RotateCcw, 
  Eye, 
  Wrench, 
  Flame,
  AlertTriangle
} from 'lucide-react';

const AdminComplaintsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('priority');

  // Modals state
  const [assignModal, setAssignModal] = useState({ open: false, complaint: null, staffId: '', remarks: '' });
  const [severityModal, setSeverityModal] = useState({ open: false, complaint: null, severity: 3 });
  const [reopenModal, setReopenModal] = useState({ open: false, complaint: null, remarks: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllComplaints({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority_level: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: search || undefined,
        sort_by: sortBy,
      });
      setComplaints(res.complaints || []);
    } catch (err) {
      toast.error('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await adminService.getStaffList();
      setStaffList(res.staff || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchStaff();
  }, [statusFilter, priorityFilter, sortBy]);

  // Acknowledge complaint
  const handleAcknowledge = async (complaintId) => {
    try {
      await adminService.acknowledgeComplaint(complaintId);
      toast.success('Complaint acknowledged.');
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to acknowledge complaint.');
    }
  };

  // Submit Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModal.staffId) {
      toast.warning('Please select a staff member.');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.assignStaff(assignModal.complaint.id, assignModal.staffId, assignModal.remarks);
      toast.success('Complaint successfully assigned to staff.');
      setAssignModal({ open: false, complaint: null, staffId: '', remarks: '' });
      fetchComplaints();
      fetchStaff();
    } catch (err) {
      toast.error(err.message || 'Assignment failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Severity Update
  const handleSeveritySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await adminService.updateSeverity(severityModal.complaint.id, severityModal.severity);
      toast.success('Severity updated! Priority score recalculated.');
      setSeverityModal({ open: false, complaint: null, severity: 3 });
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to update severity.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Reopen
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await adminService.reopenComplaint(reopenModal.complaint.id, reopenModal.remarks);
      toast.success('Complaint reopened for further maintenance.');
      setReopenModal({ open: false, complaint: null, remarks: '' });
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to reopen complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.complaint_number.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.room?.location_display?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-main tracking-tight">Complaint Queue & Assignments</h2>
        <p className="text-xs text-muted mt-1">
          Review complaints, monitor intelligent priority scores, acknowledge new reports, and assign to maintenance staff.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, complaint #, location..."
              className="w-full bg-elevated border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-main placeholder-muted focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-elevated border border-border rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="reopened">Reopened</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-elevated border border-border rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-primary"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-elevated border border-border rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-primary"
            >
              <option value="priority">Sort by Priority Score</option>
              <option value="severity">Sort by Severity</option>
              <option value="date">Sort by Recent Date</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Container */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-elevated/70 border-b border-border text-muted uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Complaint</th>
                <th className="py-3.5 px-4">Location & Category</th>
                <th className="py-3.5 px-4">Priority (Score)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Staff</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    Loading complaints...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No complaints matching the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-elevated/30 transition-colors">
                    {/* Complaint ID & Title */}
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-mono text-[11px] font-bold text-muted block">
                        #{c.complaint_number}
                      </span>
                      <span className="font-semibold text-main line-clamp-1 block hover:text-cyan cursor-pointer"
                        onClick={() => navigate(`/student/complaints/${c.id}`)}>
                        {c.title}
                      </span>
                      <span className="text-[11px] text-muted">
                        by {c.student?.name || 'Student'} • {c.affected_users_count} affected
                      </span>
                    </td>

                    {/* Location & Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-main block">{c.room?.location_display}</span>
                      <span className="text-[11px] text-primary-light font-medium block">
                        {c.category?.name}
                      </span>
                    </td>

                    {/* Priority & Severity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <PriorityBadge level={c.priority_level} score={c.priority_score} />
                        <button
                          onClick={() => setSeverityModal({ open: true, complaint: c, severity: c.severity })}
                          className="p-1 hover:bg-elevated rounded text-muted hover:text-warning"
                          title="Adjust Severity"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-muted block mt-0.5">
                        Severity {c.severity}/5 • Pending {c.pending_hours}h
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Assigned Staff */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {c.assigned_staff ? (
                        <div className="flex items-center gap-1.5 text-main font-medium">
                          <Wrench className="w-3.5 h-3.5 text-cyan" />
                          <span>{c.assigned_staff.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted italic">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Acknowledge (if submitted) */}
                        {c.status === 'submitted' && (
                          <Button
                            size="sm"
                            variant="cyan"
                            icon={CheckCircle}
                            onClick={() => handleAcknowledge(c.id)}
                            className="text-xs"
                          >
                            Acknowledge
                          </Button>
                        )}

                        {/* Assign Staff (if not resolved) */}
                        {c.status !== 'resolved' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={UserPlus}
                            onClick={() =>
                              setAssignModal({
                                open: true,
                                complaint: c,
                                staffId: c.assigned_staff?.id || (staffList[0]?.staff_id || ''),
                                remarks: ''
                              })
                            }
                            className="text-xs"
                          >
                            {c.assigned_staff ? 'Reassign' : 'Assign'}
                          </Button>
                        )}

                        {/* Reopen (if resolved) */}
                        {c.status === 'resolved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={RotateCcw}
                            onClick={() => setReopenModal({ open: true, complaint: c, remarks: '' })}
                            className="text-xs text-amber-300 border-amber-500/40"
                          >
                            Reopen
                          </Button>
                        )}

                        {/* View Details */}
                        <button
                          onClick={() => navigate(`/student/complaints/${c.id}`)}
                          className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-main"
                          title="View Full Details & Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, complaint: null, staffId: '', remarks: '' })}
        title={`Assign Staff — #${assignModal.complaint?.complaint_number}`}
        subtitle="Select a maintenance technician and add assignment remarks."
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Select Maintenance Staff *
            </label>
            <select
              value={assignModal.staffId}
              onChange={(e) => setAssignModal((prev) => ({ ...prev, staffId: e.target.value }))}
              required
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs text-main focus:outline-none focus:border-primary"
            >
              <option value="">-- Choose Technician --</option>
              {staffList.map((s) => (
                <option key={s.staff_id} value={s.staff_id}>
                  {s.name} — {s.specialization} ({s.active_tasks_count} active tasks)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Assignment Instructions / Remarks
            </label>
            <textarea
              rows={3}
              value={assignModal.remarks}
              onChange={(e) => setAssignModal((prev) => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. Please bring replacement HDMI splitter and test cable integrity..."
              className="w-full bg-card border border-border rounded-xl p-3 text-xs text-main placeholder-muted focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignModal({ open: false, complaint: null, staffId: '', remarks: '' })}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={actionLoading}>
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Severity Modal */}
      <Modal
        isOpen={severityModal.open}
        onClose={() => setSeverityModal({ open: false, complaint: null, severity: 3 })}
        title="Update Issue Severity"
        subtitle="Adjusting severity dynamically recalculates the priority score."
      >
        <form onSubmit={handleSeveritySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Severity Level (1 to 5)
            </label>
            <select
              value={severityModal.severity}
              onChange={(e) => setSeverityModal((prev) => ({ ...prev, severity: Number(e.target.value) }))}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs text-main focus:outline-none focus:border-primary"
            >
              <option value={1}>1 – Minor (8 / 40 severity points)</option>
              <option value={2}>2 – Low (16 / 40 severity points)</option>
              <option value={3}>3 – Moderate (24 / 40 severity points)</option>
              <option value={4}>4 – High (32 / 40 severity points)</option>
              <option value={5}>5 – Critical (40 / 40 severity points)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSeverityModal({ open: false, complaint: null, severity: 3 })}
            >
              Cancel
            </Button>
            <Button type="submit" variant="cyan" size="sm" loading={actionLoading}>
              Recalculate Priority
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reopen Modal */}
      <Modal
        isOpen={reopenModal.open}
        onClose={() => setReopenModal({ open: false, complaint: null, remarks: '' })}
        title="Reopen Resolved Complaint"
        subtitle="Reopening marks the complaint as active again and updates its lifecycle timeline."
      >
        <form onSubmit={handleReopenSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Reason for Reopening *
            </label>
            <textarea
              rows={3}
              value={reopenModal.remarks}
              onChange={(e) => setReopenModal((prev) => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. Issue recurred, projector stopped working again the next day..."
              required
              className="w-full bg-card border border-border rounded-xl p-3 text-xs text-main placeholder-muted focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReopenModal({ open: false, complaint: null, remarks: '' })}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" loading={actionLoading}>
              Reopen Complaint
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminComplaintsPage;
