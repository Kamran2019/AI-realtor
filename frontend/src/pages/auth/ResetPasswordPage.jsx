import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../api/client";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/reset-password", {
        token: params.get("token"),
        password,
      });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Password reset failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-md p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-teal-500">Set Password</div>
        <h1 className="mt-3 font-display text-4xl text-sand-50">Choose a new password</h1>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <div>
            <label className="label">New password</label>
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {message ? <div className="rounded-2xl bg-teal-500/15 px-4 py-3 text-sm text-teal-500">{message}</div> : null}
          {error ? <div className="rounded-2xl bg-coral-500/15 px-4 py-3 text-sm text-coral-500">{error}</div> : null}
          <button type="submit" className="button-primary w-full">
            Update password
          </button>
        </form>

        <Link to="/login" className="mt-6 inline-block text-sm text-white/55 hover:text-sand-50">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

