import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  MapPin, 
  Tag, 
  ArrowRight, 
  PlusCircle,
  MessageSquareHeart,
  AlertCircle
} from 'lucide-react';

const IssueTrackerPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [trackerItems, setTrackerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'resolved'

  const fetchTrackerData = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getIssueTracker();
      setTrackerItems(res.items || []);
    } catch (err) {
      toast.error('Failed to load issue tracker.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, []);

  const filtered = trackerItems.filter((item) => {
    if (filter === 'active') return !item.tracking?.is_resolved;
    if (filter === 'resolved') return item.tracking?.is_resolved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan uppercase tracking-wider">
            <Activity className="w-4 h-4 text-cyan" />
            <span>Process & Lifecycle Tracker</span>
          </div>
          <h2 className="text-2xl font-extrabold text-main mt-1 tracking-tight">
            My Issue Tracker
          </h2>
          <p className="text-xs text-muted mt-1 max-w-xl leading-relaxed">
            Monitor the exact step-by-step resolution lifecycle of maintenance complaints you reported across campus.
          </p>
        </div>

        <Button
          variant="cyan"
          icon={PlusCircle}
          onClick={() => navigate('/student/report')}
        >
          Report New Issue
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-primary/20 text-primary-light border border-primary/30'
              : 'text-muted hover:text-main hover:bg-card'
          }`}
        >
          All Reported ({trackerItems.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === 'active'
              ? 'bg-cyan/20 text-cyan-light border border-cyan/30'
              : 'text-muted hover:text-main hover:bg-card'
          }`}
        >
          Active Repairs ({trackerItems.filter((i) => !i.tracking?.is_resolved).length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            filter === 'resolved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-muted hover:text-main hover:bg-card'
          }`}
        >
          Resolved ({trackerItems.filter((i) => i.tracking?.is_resolved).length})
        </button>
      </div>

      {/* Tracker List */}
      {loading ? (
        <div className="p-12 text-center text-muted text-sm">Loading issue tracker...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted text-xs space-y-3">
          <p>No tracked issues found in this category.</p>
          <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => navigate('/student/report')}>
            Report an Issue Now
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((item) => {
            const tracking = item.tracking;
            return (
              <Card key={item.id} className="space-y-5">
                {/* Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan">
                        #{item.complaint_number}
                      </span>
                      <span className="text-xs text-muted">
                        • Reported on {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 
                      onClick={() => navigate(`/student/complaints/${item.id}`)}
                      className="text-lg font-bold text-main mt-1 hover:text-cyan cursor-pointer transition-colors"
                    >
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <PriorityBadge level={item.priority_level} score={item.priority_score} />
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan" />
                    <span>{item.room?.location_display}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary-light" />
                    <span>{item.category?.name}</span>
                  </span>
                  {item.assigned_staff ? (
                    <span className="flex items-center gap-1.5 text-cyan-light font-medium">
                      <Wrench className="w-3.5 h-3.5 text-cyan" />
                      <span>Technician: {item.assigned_staff.name} ({item.assigned_staff.specialization})</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-muted">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending assignment for {item.pending_hours}h</span>
                    </span>
                  )}
                </div>

                {/* Progress Bar & Percentage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-main">
                      Overall Progress: Step {tracking?.current_step} of {tracking?.total_steps}
                    </span>
                    <span className="font-mono font-bold text-cyan">
                      {tracking?.progress_percentage}% Completed
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-elevated rounded-full overflow-hidden border border-border">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${
                        tracking?.is_resolved
                          ? 'bg-gradient-to-r from-cyan to-success'
                          : 'bg-gradient-to-r from-primary to-cyan'
                      }`}
                      style={{ width: `${tracking?.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Step-by-Step Stepper Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-2">
                  {tracking?.steps?.map((step) => (
                    <div
                      key={step.step_number}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        step.current
                          ? 'bg-cyan/15 border-cyan/50 text-cyan-light shadow-md shadow-cyan/10'
                          : step.completed
                          ? 'bg-elevated/70 border-success/40 text-slate-300'
                          : 'bg-elevated/30 border-border/50 text-muted opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] font-bold">
                          STEP 0{step.step_number}
                        </span>
                        {step.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-600" />
                        )}
                      </div>
                      <p className="font-semibold leading-tight text-main">{step.label}</p>
                      <p className="text-[10px] text-muted mt-1 line-clamp-2 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Resolution Notes preview if resolved */}
                {tracking?.is_resolved && item.resolution && (
                  <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-success flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Repairs Completed by {item.resolution.staff_name}
                      </span>
                      <Button
                        size="sm"
                        variant="success"
                        icon={MessageSquareHeart}
                        onClick={() => navigate('/student/feedback')}
                        className="text-xs"
                      >
                        Leave Public Feedback
                      </Button>
                    </div>
                    <p className="text-slate-300 pt-1 leading-relaxed">
                      "{item.resolution.resolution_notes}"
                    </p>
                  </div>
                )}

                {/* Bottom link to full detail timeline */}
                <div className="flex justify-end pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ArrowRight}
                    onClick={() => navigate(`/student/complaints/${item.id}`)}
                    className="text-xs"
                  >
                    View Audit Timeline
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IssueTrackerPage;
