import { useState, useRef, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "@/services/notificationService";
import type { Notification } from "@/types/notification";

const typeConfig: Record<string, string> = {
  License: "🪪",
  Medical: "🏥",
  Training: "📋",
  Incident: "⚠️",
  Document: "🗂️",
  System: "⚙️",
  General: "🔔",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchCountAndRecent = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);

      const res = await notificationService.getAll({ onlyUnread: true, page: 1, pageSize: 5 });
      setRecentNotifications(res.items || []);
    } catch (e) {
      console.error("Failed to load notifications in bell:", e);
    }
  }, []);

  useEffect(() => {
    fetchCountAndRecent();
    // Poll every 30s for new notifications
    const interval = setInterval(fetchCountAndRecent, 30_000);
    return () => clearInterval(interval);
  }, [fetchCountAndRecent]);

  useEffect(() => {
    if (open) {
      fetchCountAndRecent();
    }
  }, [open, fetchCountAndRecent]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 animate-fade-in rounded-2xl border border-slate-200/70 bg-white p-3 shadow-soft-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</p>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                {unreadCount} unread
              </span>
            )}
          </div>
          
          {unreadCount > 0 && recentNotifications.length > 0 ? (
            <div className="max-h-72 overflow-y-auto my-2 divide-y divide-slate-100 dark:divide-slate-700">
              {recentNotifications.map(n => {
                const icon = typeConfig[n.notificationType] || typeConfig.General;
                return (
                  <div key={n.notificationId} className="py-2.5 flex items-start gap-2.5">
                    <div className="text-lg flex-shrink-0 mt-0.5">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await notificationService.markAsRead(n.notificationId);
                              setRecentNotifications(prev => prev.filter(item => item.notificationId !== n.notificationId));
                              setUnreadCount(c => Math.max(0, c - 1));
                            } catch (err) {
                              console.error("Failed to mark read from bell:", err);
                            }
                          }}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Mark read
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await notificationService.dismiss(n.notificationId);
                              setRecentNotifications(prev => prev.filter(item => item.notificationId !== n.notificationId));
                              setUnreadCount(c => Math.max(0, c - 1));
                            } catch (err) {
                              console.error("Failed to dismiss from bell:", err);
                            }
                          }}
                          className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">
              All caught up! No new notifications.
            </p>
          )}

          <button
            onClick={() => { setOpen(false); navigate("/notifications"); }}
            className="w-full rounded-lg py-2 mt-2 text-center text-xs font-semibold text-blue-600 hover:bg-slate-50 dark:text-blue-400 dark:hover:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 pt-2"
          >
            View all notifications →
          </button>
        </div>
      )}
    </div>
  );
}
