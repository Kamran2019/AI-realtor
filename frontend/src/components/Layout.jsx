const Layout = ({ children }) => (
  <div className="app-shell">
    <header className="site-header">
      <a href="/" className="brand">
        AI Realtor
      </a>
    </header>
    <main className="site-main">{children}</main>
  </div>
);

export default Layout;
