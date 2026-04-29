import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FormError from "../../components/ui/FormError.jsx";
import { verifyEmail } from "../../services/authApi.js";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token ? "Verifying email..." : "Verification token is missing."
  );
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!token || hasSubmitted.current) {
      return;
    }

    hasSubmitted.current = true;

    const submitVerification = async () => {
      try {
        const response = await verifyEmail({ token });

        setStatus("success");
        setMessage(response.data.message || "Email verified successfully.");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Email verification failed. Please try again.");
      }
    };

    submitVerification();
  }, [token]);

  return (
    <section className="auth-page" aria-labelledby="verify-email-title">
      <div className="auth-panel">
        <p className="eyebrow">Email verification</p>
        <h1 id="verify-email-title">Verify email</h1>
        <div className="route-status" aria-live="polite">
          {status === "error" ? (
            <FormError>{message}</FormError>
          ) : (
            <p className={status === "success" ? "form-success" : undefined}>{message}</p>
          )}
        </div>
        <p className="auth-switch">
          <Link to="/login">Go to login</Link>
        </p>
      </div>
    </section>
  );
};

export default VerifyEmailPage;
