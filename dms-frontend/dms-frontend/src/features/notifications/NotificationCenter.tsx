import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { BellOff, CheckCheck, RefreshCw } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import PageHeader from "@/components/common/PageHeader";
import Loader from "@/components/common/Loader";
import type { Notification } from "@/types/notification";
import { formatDistanceToNow } from "date-fns";

const typeConfig: Record<string, { icon: string; color: string; bg: string; darkBg: string }> = {
  LicenseExpiry:   { icon: "🪪", color: "text-amber-700", bg: "bg-amber-50",   darkBg: "dark:bg-amber-900/20" },
  MedicalExpiry:   { icon: "🏥", color: "text-rose-700",  bg: "bg-rose-50",    darkBg: "dark:bg-rose-900/20" },
  TrainingExpiry:  { icon: "📋", color: "text-blue-700",  bg: "bg-blue-50",    darkBg: "dark:bg-blue-900/20" },
  IncidentAlert:   { icon: "⚠️", color: "text-orange-700",bg: "bg-orange-50",  darkBg: "dark:bg-orange-900/20" },
  General:         { icon: "🔔", color: "text-slate-700", bg: "bg-slate-50",   darkBg: "dark:bg-slate-800/50" },
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAll({ onlyUnread: filter === "unread" });
      setNotifications(res.items || res || []);
    } catch { toast.error("Failed to load notifications"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const markRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
    } catch { toast.error("Failed to mark as read"); }
  };

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed to mark all as read"); } finally { setMarkingAll(false); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayed = filter === "unread" ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay up-to-date with license expirations, medical compliance alerts, training reminders, and safety incidents."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <RefreshCw size={14} /> Refresh
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllRead} disabled={markingAll} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500">
                <CheckCheck size={16} /> Mark All Read
              </button>
            )}
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 w-fit">
        {(["all", "unread"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"}`}>
            {f}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader /></div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900 text-3xl">
            <BellOff className="text-slate-400" size={28} />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {filter === "unread" ? "All caught up!" : "No notifications"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{filter === "unread" ? "You have no unread notifications." : "Notifications will appear here when compliance events occur."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((n) => {
            const cfg = typeConfig[n.notificationType] || typeConfig.General;
            return (
              <div key={n.notificationId}
                className={`group relative flex items-start gap-4 rounded-2xl border px-5 py-4 transition-all
                  ${n.isRead
                    ? "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950"
                    : `border-blue-100 ${cfg.bg} ${cfg.darkBg} dark:border-blue-900/30`
                  }`}>
                {/* Unread dot */}
                {!n.isRead && (
                  <span className="absolute left-2.5 top-5 h-2 w-2 rounded-full bg-blue-500" />
                )}

                {/* Icon */}
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${cfg.bg} ${cfg.darkBg}`}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${cfg.color} dark:text-white`}>{n.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-slate-400">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color} ${cfg.bg} ${cfg.darkBg}`}>
                      {n.notificationType?.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    {!n.isRead && (
                      <button onClick={() => markRead(n.notificationId)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
