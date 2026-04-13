import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthMessage, signup } from "../../features/auth/authSlice";

export default function SignupPage() {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    timezone: "UTC",
    locale: "en-GB",
  });

  useEffect(() => {
    dispatch(clearAuthMessage());
  }, [dispatch]);

  const submit = async (event) => {
    event.preventDefault();
    await dispatch(signup(form));
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-lg p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-teal-500">New Account</div>
        <h1 className="mt-3 font-display text-4xl text-sand-50">Create your admin workspace</h1>
        <p className="mt-3 text-sm text-white/60">Each signup creates a single account owner who can later invite sub-admins and users under the same account.</p>

        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={submit}>
          <div className="md:col-span-2">
            <label className="label">Name</label>
            <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="label">Email</label>
            <input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="label">Password</label>
            <input className="field" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <label className="label">Timezone</label>
            <input className="field" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          </div>
          <div>
            <label className="label">Locale</label>
            <input className="field" value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} />
          </div>

          {error ? <div className="rounded-2xl bg-coral-500/15 px-4 py-3 text-sm text-coral-500 md:col-span-2">{error}</div> : null}
          {successMessage ? (
            <div className="rounded-2xl bg-teal-500/15 px-4 py-3 text-sm text-teal-500 md:col-span-2">{successMessage}</div>
          ) : null}

          <button className="button-primary md:col-span-2" disabled={loading} type="submit">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-sm text-white/55">
          Already have an account?{" "}
          <Link to="/login" className="text-sand-50 hover:text-teal-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

