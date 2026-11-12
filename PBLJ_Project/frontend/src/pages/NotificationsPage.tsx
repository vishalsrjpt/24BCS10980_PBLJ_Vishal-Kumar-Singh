import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Sparkles, ShieldCheck, Clock, Tag } from 'lucide-react';
import api from '../services/api';
import { Notification, PageResponse, ApiResponse } from '../types';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<ApiResponse<PageResponse<Notification>>>('/notifications?size=50');
      if (res.data.success && res.data.data) {
        setNotifications(res.data.data.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filterUnread ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates regarding your reports, claim decisions, and smart match detections
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            !filterUnread ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterUnread ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading notifications..." />
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 text-xs transition-colors flex items-start justify-between gap-4 ${
                !n.read ? 'bg-indigo-50/30' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    n.type === 'MATCH_FOUND'
                      ? 'bg-teal-50 text-teal-600'
                      : n.type === 'CLAIM_APPROVED'
                      ? 'bg-emerald-50 text-emerald-600'
                      : n.type === 'CLAIM_REJECTED'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {n.type === 'MATCH_FOUND' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : n.type === 'CLAIM_APPROVED' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-xs">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No notifications found"
          description={filterUnread ? "You're all caught up! No unread notifications." : "You have no notifications yet."}
          icon={Bell}
        />
      )}
    </div>
  );
};
