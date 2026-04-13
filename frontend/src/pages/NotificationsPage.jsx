import { useEffect, useState } from "react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = () => {
    api.get("/notifications").then((response) => {
      setNotifications(response.data.items);
      setUnreadCount(response.data.unreadCount);
    });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    loadNotifications();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description={`You currently have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`}
        actions={
          <button type="button" className="button-secondary" onClick={() => markRead("all")}>
            Mark all as read
          </button>
        }
      />

      <div className="space-y-4">
        {notifications.map((item) => (
          <div key={item.id} className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-sand-50">{item.title}</div>
                <div className="mt-2 text-sm text-white/60">{item.message}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/35">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
              {!item.isRead ? (
                <button type="button" className="button-primary" onClick={() => markRead(item.id)}>
                  Mark read
                </button>
              ) : (
                <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/45">Read</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

