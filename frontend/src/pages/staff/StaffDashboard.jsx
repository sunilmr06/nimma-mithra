import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import NotificationsWidget from '../../components/common/NotificationsWidget';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { 
  Wrench, 
  Play, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Tag, 
  Upload, 
  X, 
  Eye, 
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active'); // 'active', 'all', 'in_progress', 'resolved'

  // Resolution Modal state
  const [resolveModal, setResolveModal] = useState({
    open: false,
    task: null,
    notes: '',
    cost: '',
    imageFile: null,
    imagePreview: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await staffService.getAssignedTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      toast.error('Failed to load assigned tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Action: Start Work (Assigned -> In Progress)
  const handleStartWork = async (taskId) => {
    setActionLoading(true);
    try {
      await staffService.updateStatus(taskId, 'in_progress', 'Maintenance technician started on-site work.');
      toast.success('Task status updated to In Progress.');
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to update task status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Image handling in Resolution Modal
  const handleResolutionImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolveModal((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  // Action: Submit Resolution
  const handleResolutionSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModal.notes.trim()) {
      toast.warning('Please enter resolution notes.');
      return;
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('resolution_notes', resolveModal.notes.trim());
      formData.append('cost_amount', resolveModal.cost || '0');
      if (resolveModal.imageFile) {
        formData.append('photograph', resolveModal.imageFile);
      }

      await staffService.submitResolution(resolveModal.task.id, formData);
      toast.success('Issue marked as resolved! Student and administrators notified.');
      setResolveModal({ open: false, task: null, notes: '', cost: '', imageFile: null, imagePreview: null });
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to resolve task.');
    } finally {
      setActionLoading(false);
    }
  };

  const totalAssigned = tasks.length;
  const newTasks = tasks.filter((t) => t.status === 'assigned').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'resolved').length;

  const filteredTasks = tasks.filter((t) => {
    if (tab === 'active') return ['assigned', 'in_progress', 'reopened'].includes(t.status);
    if (tab === 'assigned') return t.status === 'assigned';
    if (tab === 'in_progress') return t.status === 'in_progress';
    if (tab === 'resolved') return t.status === 'resolved';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan/20 via-card to-primary/10 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-cyan uppercase tracking-wider">
            Technician Dashboard
          </span>
          <h2 className="text-2xl font-extrabold text-main mt-1 tracking-tight">
            Assigned Work Orders — {user?.name}
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Specialization: <strong className="text-cyan-light">{user?.specialization || 'Facilities Maintenance'}</strong>.
            Review priority ratings, execute maintenance, and submit resolution details.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assigned"
          value={totalAssigned}
          icon={Wrench}
          color="primary"
          subtext="Assigned maintenance tasks"
        />
        <StatCard
          title="Awaiting Action"
          value={newTasks}
          icon={Clock}
          color="warning"
          subtext="Assigned, work not started"
        />
        <StatCard
          title="In Progress"
          value={inProgressTasks}
          icon={Play}
          color="cyan"
          subtext="Currently being repaired"
        />
        <StatCard
          title="Completed"
          value={completedTasks}
          icon={CheckCircle2}
          color="success"
          subtext="Resolved & documented"
        />
      </div>

      {/* Notifications Widget for Staff */}
      <NotificationsWidget limit={3} />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3 overflow-x-auto text-xs">
        <button
          onClick={() => setTab('active')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            tab === 'active'
              ? 'bg-cyan text-background'
              : 'text-muted hover:text-main hover:bg-card'
          }`}
        >
          Active Tasks ({newTasks + inProgressTasks})
        </button>
        <button
          onClick={() => setTab('assigned')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            tab === 'assigned'
              ? 'bg-amber-500 text-background'
              : 'text-muted hover:text-main hover:bg-card'
          }`}
        >
          New Assigned ({newTasks})
        </button>
        <button
          onClick={() => setTab('in_progress')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            tab === 'in_progress'
              ? 'bg-cyan text-background'
              : 'text-muted hover:text-main hover:bg-card'
          }`}
        >
          In Progress ({inProgressTasks})
        </button>
        <button
          onClick={() => setTab('resolved')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            tab === 'resolved'
              ? 'bg-success text-background'
              : 'text-muted hover:text-main hover:bg-card'
          }`}
        >
          Completed ({completedTasks})
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            tab === 'all'
              ? 'bg-primary text-white'
              : 'text-muted hover:text-main hover:bg-card'
          }`}
        >
          All Tasks ({totalAssigned})
        </button>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted text-sm">Loading assigned maintenance orders...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted text-xs">
          No maintenance orders found in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((t) => (
            <Card key={t.id} className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-muted">
                  #{t.complaint_number}
                </span>
                <div className="flex items-center gap-2">
                  <PriorityBadge level={t.priority_level} score={t.priority_score} />
                  <StatusBadge status={t.status} />
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-main line-clamp-1">{t.title}</h4>
                <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                  {t.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan" />
                  <span>{t.room?.location_display}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary-light" />
                  <span>{t.category?.name}</span>
                </span>
                {t.image_url && (
                  <span className="flex items-center gap-1 text-cyan text-[11px] font-medium bg-cyan/10 px-2 py-0.5 rounded-md">
                    <ImageIcon className="w-3 h-3" /> Photo Attached
                  </span>
                )}
              </div>

              {/* Action Buttons for Staff */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigate(`/student/complaints/${t.id}`)}
                  className="flex items-center gap-1 text-xs text-muted hover:text-main"
                >
                  <Eye className="w-4 h-4" />
                  <span>Timeline</span>
                </button>

                <div className="flex items-center gap-2">
                  {t.status === 'assigned' && (
                    <Button
                      size="sm"
                      variant="cyan"
                      icon={Play}
                      onClick={() => handleStartWork(t.id)}
                      loading={actionLoading}
                    >
                      Start Work
                    </Button>
                  )}

                  {['assigned', 'in_progress', 'reopened'].includes(t.status) && (
                    <Button
                      size="sm"
                      variant="success"
                      icon={CheckCircle}
                      onClick={() =>
                        setResolveModal({
                          open: true,
                          task: t,
                          notes: '',
                          cost: '',
                          imageFile: null,
                          imagePreview: null,
                        })
                      }
                    >
                      Mark Resolved
                    </Button>
                  )}

                  {t.status === 'resolved' && (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
                      {t.resolution && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          t.resolution.cost_status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : t.resolution.cost_status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          Cost: ₹{t.resolution.cost_amount ? Number(t.resolution.cost_amount).toFixed(2) : '0.00'} ({t.resolution.cost_status === 'approved' ? 'Approved' : t.resolution.cost_status === 'rejected' ? 'Rejected' : 'Pending Review'})
                        </span>
                      )}
                      <span className="text-xs text-success font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Resolved
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Submission Modal */}
      <Modal
        isOpen={resolveModal.open}
        onClose={() =>
          setResolveModal({ open: false, task: null, notes: '', cost: '', imageFile: null, imagePreview: null })
        }
        title={`Complete & Resolve — #${resolveModal.task?.complaint_number}`}
        subtitle="Document your maintenance repair notes, repair expenses, and completion photo."
      >
        <form onSubmit={handleResolutionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Resolution Notes *
            </label>
            <textarea
              rows={3}
              required
              value={resolveModal.notes}
              onChange={(e) => setResolveModal({ ...resolveModal, notes: e.target.value })}
              placeholder="Describe repairs performed, parts replaced, and testing conducted..."
              className="w-full bg-card border border-border rounded-xl p-3 text-xs text-main placeholder-muted focus:outline-none focus:border-cyan resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Repair & Material Cost (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted text-xs font-bold pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 450.00 (enter 0 if no parts purchased)"
                value={resolveModal.cost}
                onChange={(e) => setResolveModal({ ...resolveModal, cost: e.target.value })}
                className="w-full bg-card border border-border rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-main placeholder-muted focus:outline-none focus:border-cyan"
              />
            </div>
            <p className="text-[11px] text-muted mt-1">Submitted costs will be sent to the campus administrator for verification and approval.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Completion Photograph (Optional)
            </label>
            {!resolveModal.imagePreview ? (
              <label className="flex items-center justify-center gap-2 p-4 border border-dashed border-border rounded-xl cursor-pointer hover:border-cyan bg-card/50 transition-colors">
                <Upload className="w-4 h-4 text-cyan" />
                <span className="text-xs text-muted">Upload repair proof photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleResolutionImage}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-border max-w-xs">
                <img
                  src={resolveModal.imagePreview}
                  alt="Resolution proof preview"
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setResolveModal((prev) => ({
                      ...prev,
                      imageFile: null,
                      imagePreview: null,
                    }))
                  }
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/80 text-main"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setResolveModal({
                  open: false,
                  task: null,
                  notes: '',
                  imageFile: null,
                  imagePreview: null,
                })
              }
            >
              Cancel
            </Button>
            <Button type="submit" variant="success" size="sm" loading={actionLoading}>
              Confirm Issue Resolution
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffDashboard;
