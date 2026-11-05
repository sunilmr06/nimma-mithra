import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import StatusDonutChart from '../../components/charts/StatusDonutChart';
import CategoryBarChart from '../../components/charts/CategoryBarChart';
import TrendsLineChart from '../../components/charts/TrendsLineChart';
import PriorityBarChart from '../../components/charts/PriorityBarChart';
import { 
  FileText, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Sparkles,
  Timer
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [trends, setTrends] = useState([]);
  const [priorityDist, setPriorityDist] = useState([]);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, catRes, statusRes, trendRes, prioRes, queueRes] = await Promise.all([
          adminService.getAnalyticsSummary(),
          adminService.getCategoryDistribution(),
          adminService.getStatusDistribution(),
          adminService.getTrends(),
          adminService.getPriorityDistribution(),
          adminService.getAllComplaints({ sort_by: 'priority' }),
        ]);

        setSummary(sumRes);
        setCategories(catRes.categories || []);
        setStatusDist(statusRes.distribution || []);
        setTrends(trendRes.trends || []);
        setPriorityDist(prioRes.priority_distribution || []);
        setPriorityQueue((queueRes.complaints || []).filter((c) => c.status !== 'resolved').slice(0, 5));
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-muted text-sm">Loading admin dashboard analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-primary-light uppercase tracking-wider">
            Campus Administration
          </span>
          <h2 className="text-2xl font-extrabold text-main mt-0.5 tracking-tight">
            Maintenance Operations Overview
          </h2>
          <p className="text-xs text-muted mt-1">
            Real-time monitoring of campus facilities, intelligent priority queues, and staff workload distribution.
          </p>
        </div>

        <Button
          variant="primary"
          icon={FileText}
          onClick={() => navigate('/admin/complaints')}
        >
          Manage Complaint Queue
        </Button>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Reports"
          value={summary?.total_complaints || 0}
          icon={FileText}
          color="primary"
          subtext="All-time complaints"
        />
        <StatCard
          title="Pending Review"
          value={summary?.pending_complaints || 0}
          icon={Clock}
          color="warning"
          subtext="Submitted & Acknowledged"
        />
        <StatCard
          title="Active Ongoing"
          value={summary?.ongoing_complaints || 0}
          icon={Wrench}
          color="cyan"
          subtext="Assigned & In Progress"
        />
        <StatCard
          title="Resolved"
          value={summary?.resolved_complaints || 0}
          icon={CheckCircle2}
          color="success"
          subtext="Issues completed"
        />
        <StatCard
          title="Critical Issues"
          value={summary?.critical_issues || 0}
          icon={AlertTriangle}
          color="critical"
          subtext="Safety & urgent priority"
        />
      </div>

      {/* Average Resolution Time Metric Banner */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-main font-semibold">
          <Timer className="w-4 h-4 text-cyan" />
          <span>Average Resolution Duration:</span>
          <span className="text-cyan font-mono text-sm">
            {summary?.avg_resolution_time_hours || 0} hours
          </span>
          <span className="text-muted font-normal">from report to completion.</span>
        </div>

        {summary?.reopened_complaints > 0 && (
          <span className="text-amber-400 font-medium">
            ⚠️ {summary.reopened_complaints} complaint(s) reopened for secondary review
          </span>
        )}
      </div>

      {/* High Priority Queue Preview */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h3 className="text-base font-bold text-main">Intelligent Priority Queue (Top Urgent)</h3>
            <p className="text-xs text-muted">Complaints ranked dynamically by Severity, Affected Users, and Pending Time</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/complaints')}
            className="text-xs text-cyan"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {priorityQueue.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">No active complaints pending in priority queue.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {priorityQueue.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/student/complaints/${c.id}`)}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-elevated/40 p-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted">#{c.complaint_number}</span>
                    <h4 className="text-sm font-semibold text-main hover:text-cyan transition-colors">
                      {c.title}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span>{c.room?.location_display}</span>
                    <span>• {c.category?.name}</span>
                    <span>• {c.affected_users_count} student(s) affected</span>
                    <span>• Pending {c.pending_hours} hrs</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge level={c.priority_level} score={c.priority_score} />
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="space-y-2">
          <h3 className="text-sm font-bold text-main">Complaint Status Distribution</h3>
          <p className="text-xs text-muted">Real-time status breakdown across all submitted issues</p>
          <StatusDonutChart data={statusDist} />
        </Card>

        {/* Category Breakdown */}
        <Card className="space-y-2">
          <h3 className="text-sm font-bold text-main">Category-wise Complaints</h3>
          <p className="text-xs text-muted">Volume of maintenance issues reported per category</p>
          <CategoryBarChart data={categories} />
        </Card>

        {/* Priority Distribution */}
        <Card className="space-y-2">
          <h3 className="text-sm font-bold text-main">Priority Score Distribution</h3>
          <p className="text-xs text-muted">Distribution of low, medium, high, and critical issues</p>
          <PriorityBarChart data={priorityDist} />
        </Card>

        {/* Monthly Trends */}
        <Card className="space-y-2">
          <h3 className="text-sm font-bold text-main">Maintenance Resolution Trends</h3>
          <p className="text-xs text-muted">Reported complaints vs successfully resolved over time</p>
          <TrendsLineChart data={trends} />
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
