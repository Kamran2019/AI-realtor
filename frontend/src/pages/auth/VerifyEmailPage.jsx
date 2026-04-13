import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/client";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true, message: "", error: "" });

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState({ loading: false, message: "", error: "Verification token missing." });
      return;
    }

    api
      .post("/auth/verify-email", { token })
      .then((response) =>
        setState({ loading: false, message: response.data.message, error: "" })
      )
      .catch((error) =>
        setState({
          loading: false,
          message: "",
          error: error.response?.data?.message || "Verification failed",
        })
      );
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-md p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-teal-500">Email Verification</div>
        <h1 className="mt-3 font-display text-4xl text-sand-50">Confirming your account</h1>
        <div className="mt-8 rounded-2xl bg-white/5 px-4 py-5 text-sm text-white/70">
          {state.loading ? "Verifying token..." : state.message || state.error}
        </div>
        <Link to="/login" className="mt-6 inline-block text-sm text-white/55 hover:text-sand-50">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}

