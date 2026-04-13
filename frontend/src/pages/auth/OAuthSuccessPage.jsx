import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { setAccessToken } from "../../api/client";
import { setSession } from "../../features/auth/authSlice";

export default function OAuthSuccessPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = params.get("accessToken");
    if (!accessToken) {
      setError("Missing Google access token.");
      return;
    }

    setAccessToken(accessToken);
    api
      .get("/auth/me")
      .then((response) => {
        dispatch(setSession(response.data));
        navigate("/");
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Google sign-in failed");
      });
  }, [dispatch, navigate, params]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-md p-8 text-center">
        <div className="text-xs uppercase tracking-[0.24em] text-teal-500">Google Login</div>
        <h1 className="mt-3 font-display text-4xl text-sand-50">Finishing sign-in</h1>
        <p className="mt-4 text-sm text-white/65">{error || "Linking your session and loading the dashboard..."}</p>
      </div>
    </div>
  );
}

