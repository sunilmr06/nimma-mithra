import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import StatusDonutChart from '../../components/charts/StatusDonutChart';
import CategoryBarChart from '../../components/charts/CategoryBarChart';
import TrendsLineChart from '../../components/charts/TrendsLineChart';
import PriorityBarChart from '../../components/charts/PriorityBarChart';
import { 
  BarChart3, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Timer,
  Wrench
} from 'lucide-react';

const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [trends, setTrends] = useState([]);
  const [priorityDist, setPriorityDist] = useState([]);
  const [staffPerf, setStaffPerf] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [sum, cat, status, tr, prio, staff] = await Promise.all([
          adminService.getAnalyticsSummary(),
          adminService.getCategoryDistribution(),
          adminService.getStatusDistribution(),
          adminService.getTrends(),
          adminService.getPriorityDistribution(),
          adminService.getStaffPerformance(),
        ]);
        setSummary(sum);
        setCategories(cat.categories || []);
        setStatusDist(status.distribution || []);
        setTrends(tr.trends || []);
        setPriorityDist(prio.priority_distribution || []);
        setStaffPerf(staff.staff_performance || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-muted text-sm">Generating maintenance analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary-light uppercase tracking-wider">
          <BarChart3 className="w-4 h-4 text-primary-light" />
          <span>Operational Intelligence</span>
        </div>
        <h2 className="text-2xl font-extrabold text-main mt-1 tracking-tight">
          Maintenance Analytics & Metrics
        </h2>
        <p className="text-xs text-muted mt-1">
          Historical maintenance trends, priority distribution, and staff turnaround performance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={summary?.total_complaints || 0}
          icon={FileText}
          color="primary"
          subtext="Cumulative issues reported"
        />
        <StatCard
          title="Avg Resolution Time"
          value={`${summary?.avg_resolution_time_hours || 0}h`}
          icon={Timer}
          color="cyan"
          subtext="From submission to completed fix"
        />
        <StatCard
          title="Resolution Rate"
          value={
            summary?.total_complaints > 0
              ? `${Math.round((summary.resolved_complaints / summary.total_complaints) * 100)}%`
              : '100%'
          }
          icon={CheckCircle2}
          color="success"
          subtext={`${summary?.resolved_complaints || 0} resolved`}
        />
        <StatCard
          title="Critical Incidents"
          value={summary?.critical_issues || 0}
          icon={AlertTriangle}
          color="critical"
          subtext="Requiring immediate hazard control"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-2">
          <h3 className="text-sm font-bold text-main">Complaint Status Distribution</h3>
          <p className="text-xs text-muted">Proportion of complaints across all workflow states</p>
          <StatusDonutChart data={statusDist} />
        </Card>

        <Card className="space-y-2">
          <h3 className="text-sm font-bold text-main">Category Breakdown</h3>
          <p className="text-xs text-muted">Total complaints categorized by equipment type</p>
          <CategoryBarChart data={categories} />
        </Card>

        <Card className="space-y-2">
          <h3 className="text-sm font-bold text-main">Resolution Trends Over Time</h3>
          <p className="text-xs text-muted">Monthly trajectory of reported vs resolved maintenance requests</p>
          <TrendsLineChart data={trends} />
        </Card>

        <Card className="space-y-2">
          <h3 className="text-sm font-bold text-main">Priority Level Distribution</h3>
          <p className="text-xs text-muted">Explainable priority engine ranking distribution</p>
          <PriorityBarChart data={priorityDist} />
        </Card>
      </div>

      {/* Staff Performance Leaderboard */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <Wrench className="w-4 h-4 text-cyan" />
          <h3 className="text-sm font-bold text-main">Staff Resolution Performance</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-elevated/60 text-muted uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Technician</th>
                <th className="py-2.5 px-3">Specialization</th>
                <th className="py-2.5 px-3">Active Tasks</th>
                <th className="py-2.5 px-3">Completed Fixes</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {staffPerf.map((s) => (
                <tr key={s.staff_id} className="hover:bg-elevated/20">
                  <td className="py-3 px-3 font-semibold text-main">{s.name}</td>
                  <td className="py-3 px-3 text-cyan-light">{s.specialization}</td>
                  <td className="py-3 px-3 font-mono">{s.active_tasks_count}</td>
                  <td className="py-3 px-3 font-mono text-success font-bold">{s.completed_tasks_count}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        s.is_available
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {s.is_available ? 'Available' : 'High Load'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
