import { Link } from "react-router-dom";

const Layout = ({ children }) => (
  <div className="app-shell">
    <header className="site-header">
      <Link to="/" className="brand">
        AI Realtor
      </Link>
      <nav className="site-nav" aria-label="Primary">
        <Link to="/signup">Sign up</Link>
      </nav>
    </header>
    <main className="site-main">{children}</main>
  </div>
);

export default Layout;
