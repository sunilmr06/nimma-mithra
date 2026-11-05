import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { AlertTriangle, ThumbsUp, PlusCircle, MapPin, Tag, Users } from 'lucide-react';

const DuplicateWarningModal = ({
  isOpen,
  onClose,
  duplicates = [],
  onSupportExisting,
  onSubmitAnyway,
  isSubmitting = false,
  isSupporting = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Similar Complaints Found"
      subtitle="CampusCare detected potential matching reports. You can support the existing issue or proceed with a new submission."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-warning">Notice:</span> A similar maintenance issue has already been reported at or near this location.
            Supporting an existing issue increases its priority score and speeds up resolution! However, you can always choose to submit your complaint separately.
          </div>
        </div>

        {/* List of Duplicate Matches */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {duplicates.map((dup) => (
            <div
              key={dup.complaint_id}
              className="p-4 rounded-xl bg-card border border-border hover:border-slate-600 transition-all space-y-2.5"
            >
              {/* Header with similarity % */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-muted">
                  #{dup.complaint_number}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-warning border border-amber-500/30">
                  {dup.similarity_score}% Match ({dup.interpretation})
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="text-sm font-semibold text-main">{dup.title}</h4>
                <p className="text-xs text-muted mt-1 line-clamp-2">{dup.description}</p>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted pt-1">
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan" />
                  {dup.location_display}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-primary-light" />
                  {dup.category_name}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  {dup.supporters_count} supporter(s)
                </span>
                <StatusBadge status={dup.status} />
              </div>

              {/* Match Reasons */}
              {dup.reasons && dup.reasons.length > 0 && (
                <div className="text-[11px] text-muted bg-elevated/60 px-2.5 py-1.5 rounded-lg flex flex-wrap gap-2">
                  <span className="font-semibold text-slate-400">Match factors:</span>
                  {dup.reasons.map((r, i) => (
                    <span key={i} className="text-slate-300">• {r}</span>
                  ))}
                </div>
              )}

              {/* Quick support button for this specific duplicate */}
              <div className="pt-1 flex justify-end">
                <Button
                  size="sm"
                  variant="success"
                  icon={ThumbsUp}
                  loading={isSupporting}
                  onClick={() => onSupportExisting(dup.complaint_id)}
                >
                  Support this complaint
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
          <p className="text-xs text-muted">
            Choose whether to combine support or keep complaints separate.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={PlusCircle}
              loading={isSubmitting}
              onClick={onSubmitAnyway}
              className="w-full sm:w-auto border-primary/40 text-primary-light hover:bg-primary/20"
            >
              Submit New Complaint Anyway
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DuplicateWarningModal;
