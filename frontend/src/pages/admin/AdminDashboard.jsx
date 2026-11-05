import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import NotificationsWidget from '../../components/common/NotificationsWidget';
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

      {/* Notifications Widget in Admin Dashboard */}
      <NotificationsWidget limit={4} />

      {/* Simplified Priority Issue Queue */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h3 className="text-base font-bold text-main">Priority Issue Queue</h3>
            <p className="text-xs text-muted">Clean view of active campus maintenance reports requiring attention</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/complaints')}
            className="text-xs text-cyan"
          >
            <span>Manage All Complaints</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {priorityQueue.length === 0 ? (
          <p className="text-xs text-muted py-6 text-center">No active complaints pending in priority queue.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-[11px] font-bold text-muted uppercase tracking-wider">
                  <th className="py-2.5 px-3">Issue Date</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Issue Maker Name</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-xs">
                {priorityQueue.map((c) => (
                  <tr key={c.id} className="hover:bg-elevated/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-main whitespace-nowrap">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <PriorityBadge level={c.priority_level} score={c.priority_score} />
                    </td>
                    <td className="py-3 px-3 text-main font-medium">
                      <span>{c.student?.name || 'Anonymous Student'}</span>
                      <span className="block text-[11px] text-muted">{c.student?.department || c.room?.location_display}</span>
                    </td>
                    <td className="py-3 px-3 text-muted whitespace-nowrap">
                      {c.created_at ? new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/student/complaints/${c.id}`)}
                        className="px-2.5 py-1 rounded-lg bg-card hover:bg-primary/20 text-cyan text-xs font-semibold border border-border"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
