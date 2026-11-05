import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { 
  Rss, 
  Heart, 
  MessageCircle, 
  ThumbsUp, 
  Share2, 
  MapPin, 
  Tag, 
  PlusCircle, 
  Search, 
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Send,
  User as UserIcon,
  Image as ImageIcon
} from 'lucide-react';

const PublicFeedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'trending', 'resolved', 'my_reports'
  const [search, setSearch] = useState('');

  // Comment Modal state
  const [commentModal, setCommentModal] = useState({
    open: false,
    complaint: null,
    comments: [],
    loadingComments: false,
    newCommentText: '',
    submitting: false,
  });

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getPublicFeed(activeTab, search);
      setFeedItems(res.feed || []);
    } catch (err) {
      toast.error('Failed to load public feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFeed();
  };

  // Toggle Like (X-style)
  const handleLikeToggle = async (complaintId, e) => {
    e.stopPropagation();
    try {
      const res = await complaintService.toggleLike(complaintId);
      setFeedItems((prev) =>
        prev.map((item) =>
          item.id === complaintId
            ? { ...item, is_liked_by_me: res.liked, likes_count: res.likes_count }
            : item
        )
      );
      if (res.liked) {
        toast.success('Liked issue post ❤️');
      }
    } catch (err) {
      toast.error('Failed to toggle like.');
    }
  };

  // Toggle Support
  const handleSupportToggle = async (complaint, e) => {
    e.stopPropagation();
    try {
      if (complaint.is_supported_by_me) {
        await complaintService.removeSupport(complaint.id);
        toast.info('Removed support.');
      } else {
        await complaintService.supportComplaint(complaint.id);
        toast.success('Supported issue! Priority increased.');
      }
      fetchFeed();
    } catch (err) {
      toast.error(err.message || 'Support action failed.');
    }
  };

  // Open Comments Modal
  const handleOpenComments = async (complaint, e) => {
    e.stopPropagation();
    setCommentModal({
      open: true,
      complaint,
      comments: [],
      loadingComments: true,
      newCommentText: '',
      submitting: false,
    });

    try {
      const res = await complaintService.getComments(complaint.id);
      setCommentModal((prev) => ({
        ...prev,
        comments: res.comments || [],
        loadingComments: false,
      }));
    } catch (err) {
      toast.error('Failed to load comments.');
      setCommentModal((prev) => ({ ...prev, loadingComments: false }));
    }
  };

  // Post New Comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentModal.newCommentText.trim()) return;

    setCommentModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await complaintService.addComment(
        commentModal.complaint.id,
        commentModal.newCommentText.trim()
      );
      toast.success('Comment posted!');
      setCommentModal((prev) => ({
        ...prev,
        comments: [...prev.comments, res.comment],
        newCommentText: '',
        submitting: false,
      }));
      // Update comment count on feed item
      setFeedItems((prev) =>
        prev.map((item) =>
          item.id === commentModal.complaint.id
            ? { ...item, comments_count: res.comments_count }
            : item
        )
      );
    } catch (err) {
      toast.error(err.message || 'Failed to post comment.');
      setCommentModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Share Link
  const handleShare = (complaint, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/student/complaints/${complaint.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-card to-cyan/15 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan uppercase tracking-wider">
            <Rss className="w-4 h-4 text-cyan" />
            <span>Campus Live Stream</span>
          </div>
          <h2 className="text-2xl font-extrabold text-main mt-1 tracking-tight">
            Nimma Mithra Public Feed
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Real-time feed of maintenance reports, discussions, and community updates across university facilities.
          </p>
        </div>

        <Button
          variant="cyan"
          icon={PlusCircle}
          onClick={() => navigate('/student/report')}
          className="shrink-0"
        >
          Post An Issue
        </Button>
      </div>

      {/* Quick Search & Tab Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campus feed by keywords, room #, or equipment..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-20 py-2.5 text-xs text-main placeholder-muted focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-elevated hover:bg-border text-xs text-cyan font-medium transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 border-b border-border/80 pb-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-muted hover:text-main hover:bg-card'
            }`}
          >
            <span>All Posts</span>
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'trending'
                ? 'bg-amber-500 text-background shadow-md shadow-amber-500/20'
                : 'text-muted hover:text-main hover:bg-card'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Trending Issues</span>
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'resolved'
                ? 'bg-success text-white shadow-md shadow-success/20'
                : 'text-muted hover:text-main hover:bg-card'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            <span>Resolved</span>
          </button>
          <button
            onClick={() => setActiveTab('my_reports')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'my_reports'
                ? 'bg-cyan text-background shadow-md shadow-cyan/20'
                : 'text-muted hover:text-main hover:bg-card'
            }`}
          >
            <span>My Reports</span>
          </button>
        </div>
      </div>

      {/* Feed Stream */}
      {loading ? (
        <div className="p-12 text-center text-muted text-sm">Streaming campus feed...</div>
      ) : feedItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted text-xs space-y-3">
          <p>No posts matching this feed view.</p>
          <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => navigate('/student/report')}>
            Be the First to Report
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {feedItems.map((item) => (
            <article
              key={item.id}
              onClick={() => navigate(`/student/complaints/${item.id}`)}
              className="bg-card border border-border hover:border-slate-600 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-lg space-y-3.5"
            >
              {/* Post Header: User Avatar, Name, Time, Badges */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {item.student?.avatar_url ? (
                    <img
                      src={item.student.avatar_url}
                      alt={item.student.name}
                      className="w-10 h-10 rounded-full object-cover border border-cyan/40"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-elevated border border-border flex items-center justify-center font-bold text-sm text-cyan">
                      {item.student?.name ? item.student.name.charAt(0) : 'U'}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-main hover:underline">
                        {item.student?.name || 'Anonymous Student'}
                      </span>
                      <span className="text-xs text-muted">
                        • {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">{item.student?.department || 'University Student'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge level={item.priority_level} score={item.priority_score} />
                  <StatusBadge status={item.status} />
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-bold text-main leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              {/* Photo attached */}
              {item.image_url && (
                <div className="rounded-xl overflow-hidden border border-border max-h-72 bg-elevated">
                  <img
                    src={item.image_url}
                    alt="Report evidence"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Location & Category Pills */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted pt-1">
                <span className="inline-flex items-center gap-1 bg-elevated px-2.5 py-1 rounded-lg border border-border text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan" />
                  <span>{item.room?.location_display}</span>
                </span>

                <span className="inline-flex items-center gap-1 bg-elevated px-2.5 py-1 rounded-lg border border-border text-primary-light">
                  <Tag className="w-3.5 h-3.5 text-primary-light" />
                  <span>{item.category?.name}</span>
                </span>

                {item.assigned_staff && (
                  <span className="inline-flex items-center gap-1 text-cyan text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Handled by {item.assigned_staff.name}
                  </span>
                )}
              </div>

              {/* X-Style Action Bar (Like, Comments, Support, Share) */}
              <div 
                className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Like Button */}
                <button
                  type="button"
                  onClick={(e) => handleLikeToggle(item.id, e)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                    item.is_liked_by_me
                      ? 'text-critical bg-critical/15 font-semibold'
                      : 'hover:text-critical hover:bg-critical/10'
                  }`}
                  title="Like this post"
                >
                  <Heart
                    className={`w-4 h-4 transition-transform ${
                      item.is_liked_by_me ? 'fill-critical scale-110' : ''
                    }`}
                  />
                  <span>{item.likes_count || 0}</span>
                </button>

                {/* Comment Button */}
                <button
                  type="button"
                  onClick={(e) => handleOpenComments(item, e)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:text-cyan hover:bg-cyan/10 transition-colors"
                  title="View and post comments"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{item.comments_count || 0} Replies</span>
                </button>

                {/* Support Button */}
                {item.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={(e) => handleSupportToggle(item, e)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                      item.is_supported_by_me
                        ? 'text-emerald-400 bg-emerald-500/15 font-semibold'
                        : 'hover:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                    title="Support to boost priority"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{item.supports_count || item.affected_users_count || 1} Supporters</span>
                  </button>
                )}

                {/* Share Button */}
                <button
                  type="button"
                  onClick={(e) => handleShare(item, e)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:text-primary-light hover:bg-primary/10 transition-colors"
                  title="Share / Copy Link"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Comments Thread Modal */}
      <Modal
        isOpen={commentModal.open}
        onClose={() => setCommentModal({ ...commentModal, open: false })}
        title={`Discussion Thread — #${commentModal.complaint?.complaint_number}`}
        subtitle={commentModal.complaint?.title}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {/* Comments List */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {commentModal.loadingComments ? (
              <p className="text-center text-xs text-muted py-4">Loading comments...</p>
            ) : commentModal.comments.length === 0 ? (
              <p className="text-center text-xs text-muted py-6">
                No replies yet. Start the conversation below!
              </p>
            ) : (
              commentModal.comments.map((comm) => (
                <div key={comm.id} className="p-3 rounded-xl bg-card border border-border/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-elevated border border-border flex items-center justify-center font-bold text-[10px] text-cyan">
                        {comm.author_name.charAt(0)}
                      </div>
                      <span className="font-semibold text-main">{comm.author_name}</span>
                      <span className="text-[10px] uppercase font-bold text-primary-light bg-primary/10 px-1.5 py-0.2 rounded">
                        {comm.author_role}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted">{formatTimeAgo(comm.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                    {comm.comment_text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* New Comment Input */}
          <form onSubmit={handlePostComment} className="pt-2 border-t border-border flex items-center gap-2">
            <input
              type="text"
              value={commentModal.newCommentText}
              onChange={(e) =>
                setCommentModal({ ...commentModal, newCommentText: e.target.value })
              }
              placeholder="Write a constructive comment or update..."
              required
              className="flex-1 bg-card border border-border rounded-xl px-3.5 py-2 text-xs text-main placeholder-muted focus:outline-none focus:border-primary"
            />
            <Button
              type="submit"
              variant="cyan"
              size="sm"
              icon={Send}
              loading={commentModal.submitting}
            >
              Reply
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default PublicFeedPage;
