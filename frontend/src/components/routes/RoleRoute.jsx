import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const RoleRoute = ({ children, roles }) => {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <p className="route-status">Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!roles.includes(user?.role)) {
    return (
      <section className="not-found-page" aria-labelledby="forbidden-title">
        <p className="eyebrow">403</p>
        <h1 id="forbidden-title">Access denied</h1>
        <p>You do not have permission to view this page.</p>
      </section>
    );
  }

  return children;
};

export default RoleRoute;
