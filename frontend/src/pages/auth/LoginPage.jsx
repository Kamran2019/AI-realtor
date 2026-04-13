import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthMessage, login } from "../../features/auth/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    dispatch(clearAuthMessage());
  }, [dispatch]);

  const submit = async (event) => {
    event.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-md p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-teal-500">Welcome Back</div>
        <h1 className="mt-3 font-display text-4xl text-sand-50">Sign in to your workspace</h1>
        <p className="mt-3 text-sm text-white/60">Access property scouting, inspection capture, and subscription-managed reporting.</p>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <div>
            <label className="label">Email</label>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="field"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </div>

          {error ? <div className="rounded-2xl bg-coral-500/15 px-4 py-3 text-sm text-coral-500">{error}</div> : null}

          <button className="button-primary w-full" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          className="button-secondary mt-4 w-full"
          onClick={() =>
            window.location.assign(
              `${import.meta.env.VITE_SERVER_URL || "http://localhost:5000"}/api/auth/google`
            )
          }
        >
          Continue with Google
        </button>

        <div className="mt-6 flex items-center justify-between text-sm text-white/55">
          <Link to="/forgot-password" className="hover:text-sand-50">
            Forgot password?
          </Link>
          <Link to="/signup" className="hover:text-sand-50">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

