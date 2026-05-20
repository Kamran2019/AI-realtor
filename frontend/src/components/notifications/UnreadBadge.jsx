import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUnreadCount } from "../../services/notificationApi.js";

const UnreadBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();

      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();

    const refreshInterval = window.setInterval(loadUnreadCount, 30000);
    window.addEventListener("focus", loadUnreadCount);
    window.addEventListener("notifications:changed", loadUnreadCount);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", loadUnreadCount);
      window.removeEventListener("notifications:changed", loadUnreadCount);
    };
  }, [loadUnreadCount]);

  return (
    <Link className="notification-nav-link" to="/notifications">
      Notifications
      {unreadCount > 0 ? (
        <span aria-label={`${unreadCount} unread notifications`} className="unread-badge">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
};

export default UnreadBadge;
