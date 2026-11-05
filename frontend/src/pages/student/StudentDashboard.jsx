import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import StatCard from '../../components/common/StatCard';
import ComplaintCard from '../../components/complaints/ComplaintCard';
import Button from '../../components/common/Button';
import NotificationsWidget from '../../components/common/NotificationsWidget';
import { 
  FileText, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  PlusCircle, 
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyComplaints = async () => {
      try {
        const res = await complaintService.getMyComplaints();
        setComplaints(res.complaints || []);
      } catch (err) {
        console.error('Failed to load complaints:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyComplaints();
  }, []);

  const total = complaints.length;
  const pending = complaints.filter((c) => ['submitted', 'acknowledged'].includes(c.status)).length;
  const ongoing = complaints.filter((c) => ['assigned', 'in_progress', 'reopened'].includes(c.status)).length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/20 via-card to-cyan/10 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-cyan uppercase tracking-wider">
            Student Portal
          </span>
          <h2 className="text-2xl font-extrabold text-main mt-1 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-xs text-muted mt-1 max-w-lg leading-relaxed">
            Report issues, track maintenance progress in real-time, or support existing campus complaints to boost priority.
          </p>
        </div>

        <Button
          variant="cyan"
          icon={PlusCircle}
          onClick={() => navigate('/student/report')}
          className="shrink-0"
        >
          Report New Issue
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reported"
          value={total}
          icon={FileText}
          color="primary"
          subtext="Complaints logged by you"
        />
        <StatCard
          title="Pending Review"
          value={pending}
          icon={Clock}
          color="warning"
          subtext="Awaiting admin acknowledgement"
        />
        <StatCard
          title="In Progress"
          value={ongoing}
          icon={Wrench}
          color="cyan"
          subtext="Assigned to maintenance staff"
        />
        <StatCard
          title="Resolved"
          value={resolved}
          icon={CheckCircle2}
          color="success"
          subtext="Restored and verified"
        />
      </div>

      {/* Notifications Widget */}
      <NotificationsWidget limit={3} />

      {/* Recent Complaints Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-main">My Recent Complaints</h3>
            <p className="text-xs text-muted">Latest maintenance reports submitted from your account</p>
          </div>
          {total > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/my-complaints')}
              className="text-xs text-cyan"
            >
              <span>View all ({total})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted text-sm">
            Loading your complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-card border border-border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-elevated border border-border flex items-center justify-center mx-auto text-muted">
              <Sparkles className="w-6 h-6 text-cyan" />
            </div>
            <h4 className="text-base font-semibold text-main">No complaints filed yet</h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Everything in working order? If you spot a faulty projector, leak, or electrical fault, report it below.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => navigate('/student/report')}
            >
              Report an Issue
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.slice(0, 4).map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                onClick={() => navigate(`/student/complaints/${c.id}`)}
                showActions={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
