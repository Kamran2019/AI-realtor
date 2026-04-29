import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const DashboardPage = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <p className="eyebrow">Dashboard</p>
      <h1 id="dashboard-title">Welcome, {user?.name}</h1>
      <p>Your authenticated workspace is ready.</p>
      <button className="primary-button" onClick={handleLogout} type="button">
        Log out
      </button>
    </section>
  );
};

export default DashboardPage;
