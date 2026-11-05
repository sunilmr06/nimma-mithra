import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, AlertTriangle, Users, Clock, Flame } from 'lucide-react';
import { PriorityBadge } from '../common/Badge';

const PriorityExplainer = ({ priorityScore, priorityLevel, breakdown, reasons, isSafetyEscalated }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sevScore = breakdown?.severity_score ?? 0;
  const usersScore = breakdown?.affected_users_score ?? 0;
  const timeScore = breakdown?.pending_time_score ?? 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 transition-all">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <PriorityBadge level={priorityLevel} score={priorityScore} />
          <span className="text-sm font-semibold text-main">
            Priority Engine Score: {priorityScore}/100
          </span>
          {isSafetyEscalated && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-critical bg-critical/15 px-2 py-0.5 rounded-full border border-critical/30">
              <AlertTriangle className="w-3 h-3" /> Safety Flagged
            </span>
          )}
        </div>

        <button 
          type="button" 
          className="text-xs text-cyan hover:underline flex items-center gap-1 font-medium"
        >
          <span>{isOpen ? 'Hide breakdown' : 'Why this priority?'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Breakdown progress bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/60">
        {/* Severity */}
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-warning" /> Severity</span>
            <span className="font-semibold text-main">{sevScore} / 40</span>
          </div>
          <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-warning rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (sevScore / 40) * 100)}%` }}
            />
          </div>
        </div>

        {/* Affected Users */}
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-cyan" /> Affected Users</span>
            <span className="font-semibold text-main">{usersScore} / 30</span>
          </div>
          <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (usersScore / 30) * 100)}%` }}
            />
          </div>
        </div>

        {/* Pending Time */}
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary-light" /> Pending Time</span>
            <span className="font-semibold text-main">{timeScore} / 30</span>
          </div>
          <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (timeScore / 30) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Collapsible Explanations */}
      {isOpen && reasons && reasons.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-border/60 bg-elevated/50 p-3 rounded-lg text-xs space-y-1.5">
          <p className="font-semibold text-main text-[11px] uppercase tracking-wider text-muted">
            Engine Calculation Details:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted">
            {reasons.map((reason, idx) => (
              <li key={idx} className="leading-relaxed">
                <span className="text-main">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PriorityExplainer;
