import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FormError from "../../components/ui/FormError.jsx";
import { listInspections } from "../../services/inspectionApi.js";

const emptyFilters = {
  createdFrom: "",
  search: "",
  status: ""
};

const cleanParams = (params) =>
  Object.entries(params).reduce((cleaned, [key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      cleaned[key] = value;
    }

    return cleaned;
  }, {});

const formatAssignedUser = (inspection) => {
  const assignedUser = inspection.assignedToUserId;

  if (!assignedUser) {
    return "Unassigned";
  }

  return typeof assignedUser === "string" ? assignedUser : assignedUser.name || assignedUser.email || assignedUser.id;
};

const InspectionListPage = () => {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [inspections, setInspections] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const queryParams = useMemo(
    () =>
      cleanParams({
        ...appliedFilters,
        limit: pagination.limit,
        page: pagination.page
      }),
    [appliedFilters, pagination.limit, pagination.page]
  );

  useEffect(() => {
    let isMounted = true;

    const loadInspections = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await listInspections(queryParams);

        if (isMounted) {
          setInspections(response.data.data.inspections);
          setPagination(response.data.data.pagination);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.response?.data?.message || "Inspections could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInspections();

    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1
    }));
    setAppliedFilters(filters);
  };

  const goToPage = (page) => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      page
    }));
  };

  return (
    <section className="inspections-page" aria-labelledby="inspections-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Inspections</p>
          <h1 id="inspections-title">Inspection workflow</h1>
          <p>Track room images and manual defects before AI detection is connected.</p>
        </div>
        <Link className="primary-link-button" to="/inspections/create">
          Create inspection
        </Link>
      </div>

      <form className="inspection-filter-bar" onSubmit={handleSubmit}>
        <label>
          Search
          <input
            name="search"
            onChange={handleFilterChange}
            placeholder="Address, postcode, client"
            value={filters.search}
          />
        </label>
        <label>
          Status
          <select name="status" onChange={handleFilterChange} value={filters.status}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          Created from
          <input name="createdFrom" onChange={handleFilterChange} type="date" value={filters.createdFrom} />
        </label>
        <button className="primary-button" type="submit">
          Apply
        </button>
      </form>

      <FormError>{error}</FormError>

      <div className="table-wrap">
        <table className="users-table inspections-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Property</th>
              <th>Assigned</th>
              <th>Defects</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6">Loading inspections...</td>
              </tr>
            ) : inspections.length ? (
              inspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td>
                    <span className={`status-pill status-${inspection.status}`}>{inspection.status}</span>
                  </td>
                  <td>
                    <strong>{inspection.propertyRef?.address || "No address"}</strong>
                    <span className="table-subtext">{inspection.propertyRef?.postcode || "No postcode"}</span>
                  </td>
                  <td>{formatAssignedUser(inspection)}</td>
                  <td>{inspection.summary?.totalDefects || 0}</td>
                  <td>{new Date(inspection.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/inspections/${inspection.id}`}>Open</Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No inspections found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

export default InspectionListPage;
