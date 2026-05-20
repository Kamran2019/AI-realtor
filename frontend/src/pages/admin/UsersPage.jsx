import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FormError from "../../components/ui/FormError.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { listUsers, updateUserStatus } from "../../services/userApi.js";

const initialFilters = {
  search: "",
  role: "",
  status: ""
};

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const isAdmin = currentUser?.role === "admin";

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      ...(appliedFilters.search ? { search: appliedFilters.search } : {}),
      ...(appliedFilters.role ? { role: appliedFilters.role } : {}),
      ...(appliedFilters.status ? { status: appliedFilters.status } : {})
    }),
    [appliedFilters, pagination.limit, pagination.page]
  );

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await listUsers(queryParams);

        if (isMounted) {
          setUsers(response.data.data.users);
          setPagination(response.data.data.pagination);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.response?.data?.message || "Users could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUsers();

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
    setStatusMessage("");
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1
    }));
  };

  const handleStatusChange = async (targetUser, status) => {
    setError("");
    setStatusMessage("");

    try {
      const response = await updateUserStatus(targetUser.id, { status });
      const updatedUser = response.data.data.user;

      setUsers((currentUsers) =>
        currentUsers.map((listedUser) => (listedUser.id === updatedUser.id ? updatedUser : listedUser))
      );
      setStatusMessage("User status updated.");
    } catch (statusError) {
      setError(statusError.response?.data?.message || "User status could not be updated.");
    }
  };

  const goToPage = (page) => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      page
    }));
  };

  return (
    <section className="admin-page" aria-labelledby="users-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 id="users-title">Users</h1>
        </div>
        {isAdmin ? (
          <Link className="primary-link-button" to="/admin/users/new">
            Create user
          </Link>
        ) : null}
      </div>

      <form className="filter-bar" onSubmit={handleFilterSubmit}>
        <label>
          Search
          <input
            name="search"
            onChange={handleFilterChange}
            placeholder="Name or email"
            value={filters.search}
          />
        </label>
        <label>
          Role
          <select name="role" onChange={handleFilterChange} value={filters.role}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="sub_admin">Sub admin</option>
            <option value="user">User</option>
          </select>
        </label>
        <label>
          Status
          <select name="status" onChange={handleFilterChange} value={filters.status}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="deleted">Deleted</option>
          </select>
        </label>
        <button className="primary-button" type="submit">
          Apply
        </button>
      </form>

      <FormError>{error}</FormError>
      {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
      {!isAdmin ? <p className="read-only-note">User management is read-only for sub admins.</p> : null}

      <div className="table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6">Loading users...</td>
              </tr>
            ) : users.length ? (
              users.map((listedUser) => (
                <tr key={listedUser.id}>
                  <td>{listedUser.name}</td>
                  <td>{listedUser.email}</td>
                  <td>{listedUser.role}</td>
                  <td>{listedUser.status}</td>
                  <td>{new Date(listedUser.createdAt).toLocaleDateString()}</td>
                  <td>
                    {isAdmin ? (
                      <div className="table-actions">
                        <Link to={`/admin/users/${listedUser.id}`}>Edit</Link>
                        {listedUser.status === "active" ? (
                          <button
                            className="text-button danger"
                            onClick={() => handleStatusChange(listedUser, "disabled")}
                            type="button"
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            className="text-button"
                            onClick={() => handleStatusChange(listedUser, "active")}
                            type="button"
                          >
                            Enable
                          </button>
                        )}
                      </div>
                    ) : (
                      <span>View only</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No users found.</td>
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

export default UsersPage;
