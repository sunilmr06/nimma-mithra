import React from 'react';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import Card from '../common/Card';
import Button from '../common/Button';
import { MapPin, Tag, Users, Clock, Image, ArrowRight, ThumbsUp, Wrench } from 'lucide-react';

const ComplaintCard = ({
  complaint,
  onClick,
  onSupport,
  canSupport = false,
  isSupporting = false,
  showActions = true,
}) => {
  const {
    id,
    complaint_number,
    title,
    description,
    image_url,
    status,
    priority_score,
    priority_level,
    category,
    room,
    affected_users_count,
    supports_count,
    is_supported_by_me,
    assigned_staff,
    pending_hours,
    created_at
  } = complaint;

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card hover onClick={onClick} className="space-y-3.5 group">
      {/* Top Header: Number, Created Date, Status, Priority */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-muted group-hover:text-cyan transition-colors">
            #{complaint_number}
          </span>
          <span className="text-[11px] text-muted">• {formatDate(created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge level={priority_level} score={priority_score} />
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Main Title & Description */}
      <div>
        <h4 className="text-base font-semibold text-main group-hover:text-primary-light transition-colors line-clamp-1">
          {title}
        </h4>
        <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Location & Category Pills */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-cyan shrink-0" />
          <span className="truncate max-w-[200px]">{room?.location_display || 'Campus Location'}</span>
        </span>

        <span className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-primary-light shrink-0" />
          <span>{category?.name || 'General'}</span>
        </span>

        {image_url && (
          <span className="flex items-center gap-1 text-cyan text-[11px] font-medium bg-cyan/10 px-2 py-0.5 rounded-md">
            <Image className="w-3 h-3" /> Photo Attached
          </span>
        )}
      </div>

      {/* Footer Info: Assigned Staff, Pending Time, Support Count & Actions */}
      <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          {assigned_staff ? (
            <span className="flex items-center gap-1.5 text-cyan-light font-medium">
              <Wrench className="w-3.5 h-3.5 text-cyan" />
              <span>Assigned: {assigned_staff.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending {pending_hours} hrs</span>
            </span>
          )}

          <span className="flex items-center gap-1 text-muted">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{affected_users_count || 1} student(s) affected</span>
          </span>
        </div>

        {showActions && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {canSupport && (
              <Button
                size="sm"
                variant={is_supported_by_me ? 'outline' : 'secondary'}
                icon={ThumbsUp}
                loading={isSupporting}
                onClick={onSupport}
                className={is_supported_by_me ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : ''}
              >
                {is_supported_by_me ? 'Supported' : 'Support Issue'}
              </Button>
            )}

            <button
              onClick={onClick}
              className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-main transition-colors"
              title="View details"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ComplaintCard;
