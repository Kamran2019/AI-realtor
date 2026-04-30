import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Layout = ({ children }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const canSeeAdminNav = ["admin", "sub_admin"].includes(user?.role);

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand">
          AI Realtor
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/billing">Billing</Link>
              {canSeeAdminNav ? (
                <>
                  <Link to="/scrape/sources">Scrape</Link>
                  <Link to="/admin/users">Users</Link>
                </>
              ) : null}
              <button className="nav-button" onClick={logout} type="button">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup">Sign up</Link>
            </>
          )}
        </nav>
      </header>
      <main className="site-main">{children}</main>
    </div>
  );
};

export default Layout;
