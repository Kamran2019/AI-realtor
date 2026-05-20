import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FormError from "../../components/ui/FormError.jsx";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../../services/notificationApi.js";

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

const getPropertyLabel = (notification) =>
  [
    notification.property?.address?.line1,
    notification.property?.address?.city,
    notification.property?.address?.postcode
  ]
    .filter(Boolean)
    .join(", ");

const NotificationsPage = () => {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusMessage, setStatusMessage] = useState("");

  const queryParams = useMemo(
    () => ({
      limit: pagination.limit,
      page: pagination.page
    }),
    [pagination.limit, pagination.page]
  );

  const dispatchNotificationChange = () => {
    window.dispatchEvent(new Event("notifications:changed"));
  };

  const loadNotifications = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await listNotifications(queryParams);

      setNotifications(response.data.data.notifications);
      setPagination(response.data.data.pagination);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Notifications could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [queryParams]);

  const markRead = async (notification) => {
    if (notification.readAt) {
      return;
    }

    setError("");
    setStatusMessage("");
    setMarkingIds((currentIds) => [...currentIds, notification.id]);

    try {
      const response = await markNotificationRead(notification.id);
      const updatedNotification = response.data.data.notification;

      setNotifications((currentNotifications) =>
        currentNotifications.map((listedNotification) =>
          listedNotification.id === updatedNotification.id ? updatedNotification : listedNotification
        )
      );
      setStatusMessage("Notification marked read.");
      dispatchNotificationChange();
    } catch (markError) {
      setError(getErrorMessage(markError, "Notification could not be marked read."));
    } finally {
      setMarkingIds((currentIds) => currentIds.filter((id) => id !== notification.id));
    }
  };

  const markAllRead = async () => {
    setError("");
    setStatusMessage("");
    setIsMarkingAll(true);

    try {
      await markAllNotificationsRead();
      const readAt = new Date().toISOString();

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          readAt: notification.readAt || readAt
        }))
      );
      setStatusMessage("Notifications marked read.");
      dispatchNotificationChange();
    } catch (markError) {
      setError(getErrorMessage(markError, "Notifications could not be marked read."));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const goToPage = (page) => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      page
    }));
  };

  return (
    <section className="notifications-page" aria-labelledby="notifications-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1 id="notifications-title">Inbox</h1>
          <p>Alert matches from newly scraped or updated listings.</p>
        </div>
        <button
          className="secondary-button"
          disabled={isMarkingAll || notifications.every((notification) => notification.readAt)}
          onClick={markAllRead}
          type="button"
        >
          {isMarkingAll ? "Marking..." : "Mark all read"}
        </button>
      </div>

      <FormError>{error}</FormError>
      {statusMessage ? <p className="form-success">{statusMessage}</p> : null}

      {isLoading ? (
        <p>Loading notifications...</p>
      ) : notifications.length ? (
        <div className="notification-list">
          {notifications.map((notification) => {
            const propertyLabel = getPropertyLabel(notification);

            return (
              <article
                className={notification.readAt ? "notification-item" : "notification-item unread"}
                key={notification.id}
              >
                <div>
                  <div className="notification-title-row">
                    <h2>{notification.title}</h2>
                    <span>{notification.readAt ? "Read" : "Unread"}</span>
                  </div>
                  <p>{notification.message}</p>
                  <div className="notification-meta">
                    <span>{formatDate(notification.createdAt)}</span>
                    {notification.propertyId && propertyLabel ? (
                      <Link to={`/properties/${notification.propertyId}`}>{propertyLabel}</Link>
                    ) : null}
                  </div>
                </div>
                <button
                  className="secondary-button"
                  disabled={Boolean(notification.readAt) || markingIds.includes(notification.id)}
                  onClick={() => markRead(notification)}
                  type="button"
                >
                  {markingIds.includes(notification.id) ? "Saving..." : "Mark read"}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <p>No notifications yet.</p>
      )}

      <div className="pagination-bar" aria-label="Pagination">
        <button
          className="secondary-button"
          disabled={pagination.page <= 1}
          onClick={() => goToPage(pagination.page - 1)}
          type="button"
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          className="secondary-button"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => goToPage(pagination.page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default NotificationsPage;
