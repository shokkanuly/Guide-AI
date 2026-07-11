"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { Bell, CheckCircle2, Clock, Trash2, MailOpen } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data || []);
    } catch (err) {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      // Ignored
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      // Ignored
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-white">
              Notification Center
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Stay updated on deadline reminders and newly released local grants.
            </p>
          </div>
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-emerald-light hover:underline flex items-center gap-1"
            >
              <MailOpen className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-primary/10 border border-red-primary/20 text-red-primary p-4 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-bg-card/50 border border-border-card rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-bg-card border border-border-card rounded-3xl p-16 text-center text-text-secondary">
            <Bell className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h4 className="font-outfit font-bold text-white mb-2">All Caught Up!</h4>
            <p className="text-xs max-w-sm mx-auto">
              You don't have any system updates or alert notifications at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`border rounded-2xl p-5 text-left flex items-start gap-4 transition-all duration-200 cursor-pointer ${
                  n.is_read
                    ? "bg-bg-card/40 border-border-card text-text-secondary"
                    : "bg-bg-card border-border-green/20 text-text-primary glow-card"
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  n.is_read ? "bg-bg-dark text-text-muted" : "bg-emerald-primary/10 text-emerald-light"
                }`}>
                  <Bell className="w-4.5 h-4.5" />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className={`font-bold text-sm truncate ${n.is_read ? "text-text-secondary" : "text-white"}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-text-muted flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
