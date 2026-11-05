import React, { useState, useEffect } from 'react';
import { complaintService } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { 
  MessageSquareHeart, 
  Star, 
  CheckCircle2, 
  Wrench, 
  MapPin, 
  Tag, 
  Calendar, 
  PlusCircle,
  ThumbsUp,
  User as UserIcon,
  Sparkles
} from 'lucide-react';

const PublicFeedbackPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [reviewModal, setReviewModal] = useState({
    open: false,
    complaintId: '',
    rating: 5,
    comment: '',
    submitting: false,
  });

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getPublicFeedback();
      setFeedbackData(res);
    } catch (err) {
      toast.error('Failed to load public feedback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleOpenReview = (complaintId = '') => {
    setReviewModal({
      open: true,
      complaintId: complaintId || (feedbackData?.resolved_complaints?.[0]?.id || ''),
      rating: 5,
      comment: '',
      submitting: false,
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal.complaintId) {
      toast.warning('Please select a resolved issue to review.');
      return;
    }

    setReviewModal((prev) => ({ ...prev, submitting: true }));
    try {
      await complaintService.submitFeedback(reviewModal.complaintId, {
        rating: reviewModal.rating,
        comment: reviewModal.comment.trim(),
      });
      toast.success('Your feedback has been published publicly! Thank you.');
      setReviewModal({ open: false, complaintId: '', rating: 5, comment: '', submitting: false });
      fetchFeedback();
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback.');
      setReviewModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const feedbacks = feedbackData?.feedbacks || [];
  const resolvedComplaints = feedbackData?.resolved_complaints || [];
  const avgRating = feedbackData?.average_rating || 5.0;
  const ratingDist = feedbackData?.rating_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-card to-cyan/15 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <MessageSquareHeart className="w-4 h-4 text-emerald-400" />
            <span>Public Transparency & Quality Ratings</span>
          </div>
          <h2 className="text-2xl font-extrabold text-main mt-1 tracking-tight">
            Resolved Issues & Public Feedback
          </h2>
          <p className="text-xs text-muted mt-1 max-w-xl leading-relaxed">
            Every completed campus repair is accountable. Read verified student reviews, inspect technician work notes, and rate maintenance quality.
          </p>
        </div>

        {resolvedComplaints.length > 0 && (
          <Button
            variant="success"
            icon={Star}
            onClick={() => handleOpenReview()}
            className="shrink-0"
          >
            Rate a Solved Issue
          </Button>
        )}
      </div>

      {/* Campus Satisfaction KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Rating Card */}
        <Card className="flex flex-col items-center justify-center p-6 text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Campus Maintenance Satisfaction
          </span>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-extrabold text-main font-mono">{avgRating}</span>
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(avgRating) ? 'fill-amber-400' : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted">
            Based on {feedbacks.length} student reviews across campus
          </p>
        </Card>

        {/* Rating Breakdown */}
        <Card className="p-5 md:col-span-2 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">
            Rating Distribution
          </span>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingDist[stars] || 0;
            const pct = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-muted font-medium flex items-center gap-1">
                  {stars} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-elevated rounded-full overflow-hidden border border-border/80">
                  <div
                    className="h-full bg-gradient-to-r from-cyan to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-muted">{count}</span>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Feedbacks Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-main">Recent Student Reviews on Completed Repairs</h3>
          <span className="text-xs text-muted">{feedbacks.length} Verified Reviews</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted text-sm">Loading reviews...</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted text-xs space-y-3">
            <p>No public feedback posted yet. Be the first to review a resolved maintenance issue!</p>
            {resolvedComplaints.length > 0 && (
              <Button variant="success" size="sm" icon={Star} onClick={() => handleOpenReview()}>
                Rate an Issue Now
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbacks.map((fb) => (
              <Card key={fb.id} className="space-y-3 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                {/* Header: Complaint Info & Rating */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-border/60">
                  <div>
                    <span className="font-mono text-xs font-bold text-cyan">
                      #{fb.complaint_number}
                    </span>
                    <h4 className="text-sm font-bold text-main line-clamp-1 mt-0.5">
                      {fb.complaint_title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
                    <span>{fb.rating}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs text-slate-200 leading-relaxed italic bg-elevated/40 p-3 rounded-xl border border-border/50">
                  "{fb.comment || 'Issue was resolved satisfactorily.'}"
                </p>

                {/* Staff Resolution Notes Quote */}
                {fb.resolution_notes && (
                  <div className="text-[11px] text-muted space-y-1">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> Fix verified by {fb.staff_name || 'Staff'}:
                    </span>
                    <p className="line-clamp-2 text-slate-300 pl-4 border-l border-emerald-500/40">
                      {fb.resolution_notes}
                    </p>
                  </div>
                )}

                {/* Reviewer Details */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted">
                  <div className="flex items-center gap-2">
                    {fb.user_avatar ? (
                      <img src={fb.user_avatar} alt={fb.user_name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-elevated border border-border flex items-center justify-center font-bold text-[10px] text-cyan">
                        {fb.user_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-main block">{fb.user_name}</span>
                      <span className="text-[10px] text-muted">{fb.user_department || 'Student'}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-muted font-mono">
                    {new Date(fb.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      <Modal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ ...reviewModal, open: false })}
        title="Leave Public Feedback on a Solved Issue"
        subtitle="Help improve campus facilities maintenance with your rating and remarks."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Select Resolved Issue *
            </label>
            <select
              value={reviewModal.complaintId}
              onChange={(e) => setReviewModal({ ...reviewModal, complaintId: e.target.value })}
              required
              className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-primary"
            >
              {resolvedComplaints.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.complaint_number} — {c.title} ({c.room?.location_display})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Rating (1 to 5 Stars) *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewModal({ ...reviewModal, rating: star })}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= reviewModal.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-300 ml-2">
                {reviewModal.rating} of 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Review Comment / Feedback
            </label>
            <textarea
              rows={4}
              value={reviewModal.comment}
              onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
              placeholder="How was the resolution quality? Was the issue fixed properly and on time?"
              className="w-full bg-card border border-border rounded-xl p-3 text-xs text-main placeholder-muted focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewModal({ ...reviewModal, open: false })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              size="sm"
              loading={reviewModal.submitting}
            >
              Publish Feedback
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PublicFeedbackPage;
