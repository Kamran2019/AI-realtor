import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/request-reset", { email });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Request failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-md p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-teal-500">Reset Access</div>
        <h1 className="mt-3 font-display text-4xl text-sand-50">Forgot your password?</h1>
        <p className="mt-3 text-sm text-white/60">We’ll send a reset link if the email is registered.</p>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <div>
            <label className="label">Email</label>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {message ? <div className="rounded-2xl bg-teal-500/15 px-4 py-3 text-sm text-teal-500">{message}</div> : null}
          {error ? <div className="rounded-2xl bg-coral-500/15 px-4 py-3 text-sm text-coral-500">{error}</div> : null}
          <button type="submit" className="button-primary w-full">
            Send reset link
          </button>
        </form>

        <Link to="/login" className="mt-6 inline-block text-sm text-white/55 hover:text-sand-50">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

