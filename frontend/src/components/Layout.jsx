import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Layout = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();

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
