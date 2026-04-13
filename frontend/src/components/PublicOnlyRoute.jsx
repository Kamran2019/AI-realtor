import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PublicOnlyRoute() {
  const { initialized, user } = useSelector((state) => state.auth);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/70">
        Loading workspace...
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : <Outlet />;
}

