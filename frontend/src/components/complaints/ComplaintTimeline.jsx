import React from 'react';
import { StatusBadge } from '../common/Badge';
import { CheckCircle2, Clock, User, ArrowRight } from 'lucide-react';

const ComplaintTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return <p className="text-xs text-muted">No history updates recorded yet.</p>;
  }

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {history.map((step, idx) => (
        <div key={step.id || idx} className="relative group">
          {/* Timeline Dot */}
          <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-elevated border-2 border-primary flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
          </div>

          <div className="bg-card border border-border p-3.5 rounded-xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {step.old_status && (
                  <>
                    <StatusBadge status={step.old_status} />
                    <ArrowRight className="w-3.5 h-3.5 text-muted" />
                  </>
                )}
                <StatusBadge status={step.new_status} />
              </div>
              <span className="text-[11px] text-muted flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-muted" />
                {formatDate(step.created_at)}
              </span>
            </div>

            {step.remarks && (
              <p className="text-xs text-main leading-relaxed">{step.remarks}</p>
            )}

            <div className="text-[11px] text-muted flex items-center gap-1 pt-1 border-t border-border/40">
              <User className="w-3 h-3" />
              <span>Updated by <strong className="text-slate-300">{step.updater_name}</strong></span>
              {step.updater_role && (
                <span className="text-[10px] uppercase font-bold text-primary-light">({step.updater_role})</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ComplaintTimeline;
