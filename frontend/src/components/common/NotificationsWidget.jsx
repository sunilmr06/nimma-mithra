import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import Card from './Card';
import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const NotificationsWidget = ({ limit = 4, className = '' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchNotifs = async () => {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (e) {
      console.error('Failed to load notifications in widget:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch (e) {
      toast.error('Failed to mark notifications read.');
    }
  };

  const handleItemClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      if (notif.complaint_id) {
        navigate(`/student/complaints/${notif.complaint_id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const displayedNotifs = notifications.slice(0, limit);

  return (
    <Card className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-border/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20 text-cyan">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-main flex items-center gap-2">
              Recent Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {unreadCount} unread
                </span>
              )}
            </h3>
            <p className="text-[11px] text-muted">Latest operational updates and complaint alerts</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-[11px] text-cyan hover:underline font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-muted py-4 text-center">Loading notifications...</p>
      ) : displayedNotifs.length === 0 ? (
        <div className="py-6 text-center text-muted space-y-1">
          <Bell className="w-6 h-6 mx-auto text-muted/40" />
          <p className="text-xs">All caught up! No notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                !n.is_read
                  ? 'bg-primary/10 border-cyan/40 hover:bg-primary/15'
                  : 'bg-elevated/40 border-border/50 hover:bg-elevated/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs font-semibold ${!n.is_read ? 'text-cyan-light' : 'text-main'}`}>
                  {n.title}
                </span>
                <span className="text-[10px] text-muted flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatTime(n.created_at)}
                </span>
              </div>
              <p className="text-[11px] text-muted mt-1 leading-relaxed line-clamp-2">
                {n.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default NotificationsWidget;
