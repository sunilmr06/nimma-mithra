import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import PriorityExplainer from '../../components/complaints/PriorityExplainer';
import ComplaintTimeline from '../../components/complaints/ComplaintTimeline';
import { 
  ArrowLeft, 
  MapPin, 
  Tag, 
  Users, 
  Clock, 
  ThumbsUp, 
  CheckCircle2, 
  Wrench,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supporting, setSupporting] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await complaintService.getComplaintById(id);
      setComplaint(res.complaint);
    } catch (err) {
      toast.error('Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleSupportToggle = async () => {
    if (!complaint) return;
    setSupporting(true);
    try {
      if (complaint.is_supported_by_me) {
        await complaintService.removeSupport(complaint.id);
        toast.info('Support removed.');
      } else {
        await complaintService.supportComplaint(complaint.id);
        toast.success('Added support! Affected users count and priority updated.');
      }
      fetchDetails();
    } catch (err) {
      toast.error(err.message || 'Support action failed.');
    } finally {
      setSupporting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-muted text-sm">Loading complaint details...</div>;
  }

  if (!complaint) {
    return (
      <div className="p-12 text-center text-muted space-y-3">
        <p>Complaint not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const priorityDetails = complaint.priority_details;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & top navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </button>

        <div className="flex items-center gap-2">
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      {/* Main Header Card */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan">
              #{complaint.complaint_number}
            </span>
            <span className="text-xs text-muted">
              • Submitted on {new Date(complaint.created_at).toLocaleString()}
            </span>
          </div>

          {/* Support CTA Button */}
          {complaint.status !== 'resolved' && user?.role === 'student' && (
            <Button
              size="sm"
              variant={complaint.is_supported_by_me ? 'outline' : 'secondary'}
              icon={ThumbsUp}
              loading={supporting}
              onClick={handleSupportToggle}
              className={complaint.is_supported_by_me ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : ''}
            >
              {complaint.is_supported_by_me ? 'Supported by you' : 'Support this Complaint'}
            </Button>
          )}
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
            {complaint.title}
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
            {complaint.description}
          </p>
        </div>

        {/* Location & Meta Badges */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
          <div className="flex items-center gap-1.5 text-cyan-light bg-card px-3 py-1.5 rounded-lg border border-border">
            <MapPin className="w-4 h-4 text-cyan" />
            <span className="font-medium">{complaint.room?.location_display}</span>
          </div>

          <div className="flex items-center gap-1.5 text-primary-light bg-card px-3 py-1.5 rounded-lg border border-border">
            <Tag className="w-4 h-4 text-primary-light" />
            <span className="font-medium">{complaint.category?.name}</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 bg-card px-3 py-1.5 rounded-lg border border-border">
            <Users className="w-4 h-4" />
            <span className="font-medium">{complaint.affected_users_count} Affected Student(s)</span>
          </div>

          {complaint.assigned_staff && (
            <div className="flex items-center gap-1.5 text-cyan bg-card px-3 py-1.5 rounded-lg border border-border">
              <Wrench className="w-4 h-4" />
              <span className="font-medium">Assigned: {complaint.assigned_staff.name}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Intelligent Priority Engine Explainer Box */}
      <PriorityExplainer
        priorityScore={priorityDetails?.priority_score ?? complaint.priority_score}
        priorityLevel={priorityDetails?.priority_level ?? complaint.priority_level}
        breakdown={priorityDetails?.breakdown}
        reasons={priorityDetails?.reasons}
        isSafetyEscalated={priorityDetails?.is_safety_escalated}
      />

      {/* Attached Photograph */}
      {complaint.image_url && (
        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <ImageIcon className="w-4 h-4 text-cyan" />
            <span>Report Photograph</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-border max-w-lg bg-elevated">
            <img
              src={complaint.image_url}
              alt="Issue photograph"
              className="w-full max-h-80 object-cover"
            />
          </div>
        </Card>
      )}

      {/* Resolution Details (if resolved) */}
      {complaint.resolution && (
        <Card className="space-y-3 border-emerald-500/30 bg-emerald-950/10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Resolution Information</span>
          </div>
          <div className="space-y-2 text-xs">
            <p className="text-sm font-medium text-main leading-relaxed">
              {complaint.resolution.resolution_notes}
            </p>
            <p className="text-muted">
              Resolved by <strong className="text-main">{complaint.resolution.staff_name}</strong> on{' '}
              {new Date(complaint.resolution.resolved_at).toLocaleString()}
            </p>
            {complaint.resolution.image_url && (
              <div className="pt-2">
                <img
                  src={complaint.resolution.image_url}
                  alt="Resolution proof"
                  className="rounded-xl max-h-60 border border-border object-cover"
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Lifecycle Timeline */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted pb-2 border-b border-border/60">
          <Clock className="w-4 h-4 text-cyan" />
          <span>Complaint Lifecycle Timeline</span>
        </div>
        <ComplaintTimeline history={complaint.history} />
      </Card>
    </div>
  );
};

export default ComplaintDetailPage;
