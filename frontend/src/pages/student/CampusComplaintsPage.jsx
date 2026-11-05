import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import { useToast } from '../../context/ToastContext';
import ComplaintCard from '../../components/complaints/ComplaintCard';
import { Search, Filter, Globe, Sparkles } from 'lucide-react';

const CampusComplaintsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supportingId, setSupportingId] = useState(null);

  const fetchComplaints = async () => {
    try {
      const res = await complaintService.getComplaints({
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleSupportToggle = async (complaint) => {
    setSupportingId(complaint.id);
    try {
      if (complaint.is_supported_by_me) {
        await complaintService.removeSupport(complaint.id);
        toast.info('Removed your support.');
      } else {
        await complaintService.supportComplaint(complaint.id);
        toast.success('Supported issue! Priority score updated.');
      }
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Support action failed.');
    } finally {
      setSupportingId(null);
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
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan uppercase tracking-wider">
            <Globe className="w-4 h-4 text-cyan" />
            <span>Campus-Wide Maintenance Feed</span>
          </div>
          <h2 className="text-2xl font-extrabold text-main mt-1 tracking-tight">
            Campus Maintenance Activity
          </h2>
          <p className="text-xs text-muted mt-1 max-w-xl leading-relaxed">
            See what others have reported. Support existing complaints to avoid duplicate reports and help our priority engine schedule urgent repairs faster!
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campus issues by room, building, category, or title..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-main placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-primary w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-8 text-center text-muted text-sm">Loading campus feed...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted text-xs">
          No campus complaints found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              onClick={() => navigate(`/student/complaints/${c.id}`)}
              canSupport={c.status !== 'resolved'}
              onSupport={() => handleSupportToggle(c)}
              isSupporting={supportingId === c.id}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CampusComplaintsPage;
