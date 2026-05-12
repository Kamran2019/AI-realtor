import { useEffect, useMemo, useState } from "react";
import FormError from "../../components/ui/FormError.jsx";
import { listAuditLogs } from "../../services/adminApi.js";

const initialFilters = {
  action: "",
  status: "",
  actorUserId: "",
  fromDate: "",
  toDate: ""
};

const AuditLogsPage = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      ...(appliedFilters.action ? { action: appliedFilters.action } : {}),
      ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
      ...(appliedFilters.actorUserId ? { actorUserId: appliedFilters.actorUserId } : {}),
      ...(appliedFilters.fromDate ? { fromDate: appliedFilters.fromDate } : {}),
      ...(appliedFilters.toDate ? { toDate: appliedFilters.toDate } : {})
    }),
    [appliedFilters, pagination.limit, pagination.page]
  );

  useEffect(() => {
    let isMounted = true;

    const loadLogs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await listAuditLogs(queryParams);

        if (isMounted) {
          setLogs(response.data.data.logs);
          setPagination(response.data.data.pagination);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.response?.data?.message || "Audit logs could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  const onFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  };

  const onFilterSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const goToPage = (page) => setPagination((current) => ({ ...current, page }));

  return (
    <section className="admin-page" aria-labelledby="audit-logs-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 id="audit-logs-title">Audit logs</h1>
        </div>
      </div>

      <form className="filter-bar" onSubmit={onFilterSubmit}>
        <label>
          Action
          <input name="action" onChange={onFilterChange} value={filters.action} />
        </label>
        <label>
          Status
          <select name="status" onChange={onFilterChange} value={filters.status}>
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </label>
        <label>
          Actor user ID
          <input name="actorUserId" onChange={onFilterChange} value={filters.actorUserId} />
        </label>
        <label>
          From date
          <input name="fromDate" onChange={onFilterChange} type="date" value={filters.fromDate} />
        </label>
        <label>
          To date
          <input name="toDate" onChange={onFilterChange} type="date" value={filters.toDate} />
        </label>
        <button className="primary-button" type="submit">Apply</button>
      </form>

      <FormError>{error}</FormError>

      <div className="table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Status</th>
              <th>Actor</th>
              <th>Entity</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5">Loading audit logs...</td></tr>
            ) : logs.length ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{log.status}</td>
                  <td>{log.actorRole}</td>
                  <td>{[log.entityType, log.entityId].filter(Boolean).join(":") || "-"}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5">No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar" aria-label="Pagination">
        <button className="secondary-button" disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)} type="button">Previous</button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button className="secondary-button" disabled={pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)} type="button">Next</button>
      </div>
    </section>
  );
};

export default AuditLogsPage;
