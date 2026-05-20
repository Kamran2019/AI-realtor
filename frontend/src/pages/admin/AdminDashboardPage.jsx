import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FormError from "../../components/ui/FormError.jsx";
import { getAdminDashboard } from "../../services/adminApi.js";

const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentAuditLogs, setRecentAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getAdminDashboard();

        if (isMounted) {
          setMetrics(response.data.data.metrics);
          setRecentAuditLogs(response.data.data.recentAuditLogs);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.response?.data?.message || "Admin dashboard could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="admin-page" aria-labelledby="admin-dashboard-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 id="admin-dashboard-title">Dashboard</h1>
        </div>
        <Link className="primary-link-button" to="/admin/audit-logs">
          View audit logs
        </Link>
      </div>

      <FormError>{error}</FormError>

      {isLoading ? <p>Loading admin dashboard...</p> : null}

      {metrics ? (
        <div className="admin-metric-grid">
          <article className="metric-card"><h2>Users</h2><strong>{metrics.users}</strong></article>
          <article className="metric-card"><h2>Properties</h2><strong>{metrics.properties}</strong></article>
          <article className="metric-card"><h2>Reports</h2><strong>{metrics.reports}</strong></article>
          <article className="metric-card"><h2>Scrape runs</h2><strong>{metrics.scrapeRuns}</strong></article>
          <article className="metric-card"><h2>Audit logs</h2><strong>{metrics.auditLogs}</strong></article>
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Status</th>
              <th>Actor</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {recentAuditLogs.length ? (
              recentAuditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{log.status}</td>
                  <td>{log.actorRole}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No audit log entries yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminDashboardPage;
