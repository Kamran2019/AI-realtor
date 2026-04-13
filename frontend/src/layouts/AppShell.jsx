import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Properties", to: "/properties" },
  { label: "Alerts", to: "/alerts" },
  { label: "Notifications", to: "/notifications" },
  { label: "Inspections", to: "/inspections" },
  { label: "Reports", to: "/reports" },
  { label: "Billing", to: "/billing" },
  { label: "Settings", to: "/settings" },
];

const adminItems = [
  { label: "Users", to: "/admin/users" },
  { label: "Scraper Health", to: "/admin/scrape" },
  { label: "Audit Logs", to: "/admin/audit" },
];

export default function AppShell() {
  const { user, account } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const signOut = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const visibleAdminItems = adminItems.filter(
    (item) => item.to !== "/admin/users" || user?.role === "admin"
  );

  return (
    <div className="min-h-screen bg-transparent text-sand-50">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-4 lg:grid-cols-[280px,1fr] lg:px-6">
        <aside className="panel flex flex-col gap-6 p-5">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-teal-500">SaaS Control</div>
            <h1 className="mt-2 font-display text-3xl text-sand-50">AI Auction Analyzer</h1>
            <p className="mt-2 text-sm text-white/55">Auction intelligence, snagging, inspection, and branded reporting in one workspace.</p>
          </div>

          <div className="panel-soft p-4">
            <div className="text-sm text-white/60">Signed in as</div>
            <div className="mt-2 text-lg font-semibold text-sand-50">{user?.name}</div>
            <div className="text-sm text-white/50">{user?.role}</div>
            <div className="mt-3 text-xs uppercase tracking-[0.2em] text-white/45">Plan</div>
            <div className="mt-1 text-sm text-teal-500">{account?.subscription?.plan || "free"}</div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm transition ${
                    isActive ? "bg-teal-500 text-ink-950" : "text-white/70 hover:bg-white/5 hover:text-sand-50"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {["admin", "sub_admin"].includes(user?.role) ? (
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.24em] text-white/40">Admin</div>
              <div className="space-y-2">
                {visibleAdminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3 text-sm transition ${
                        isActive ? "bg-coral-500 text-ink-950" : "text-white/70 hover:bg-white/5 hover:text-sand-50"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ) : null}

          <button type="button" className="button-secondary mt-auto" onClick={signOut}>
            Sign out
          </button>
        </aside>

        <main className="panel p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
