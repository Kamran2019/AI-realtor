import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import TextInput from "../../components/forms/TextInput.jsx";
import FormError from "../../components/ui/FormError.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const initialFormValues = {
  email: "",
  password: ""
};

const LoginPage = () => {
  const [formValues, setFormValues] = useState(initialFormValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: ""
    }));
    setFormError("");
  };

  const applyApiErrors = (error) => {
    const responseData = error.response?.data;
    const nextFieldErrors = {};

    responseData?.details?.forEach((detail) => {
      if (detail.field) {
        nextFieldErrors[detail.field] = detail.message;
      }
    });

    setFieldErrors(nextFieldErrors);
    setFormError(responseData?.message || "Login failed. Please try again.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      await login(formValues);
      setFieldErrors({});
      navigate(redirectTo, { replace: true });
    } catch (error) {
      applyApiErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page" aria-labelledby="login-title">
      <div className="auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1 id="login-title">Log in</h1>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextInput
            autoComplete="email"
            error={fieldErrors.email}
            id="login-email"
            label="Email"
            name="email"
            onChange={handleChange}
            type="email"
            value={formValues.email}
          />
          <TextInput
            autoComplete="current-password"
            error={fieldErrors.password}
            id="login-password"
            label="Password"
            name="password"
            onChange={handleChange}
            type="password"
            value={formValues.password}
          />
          <div className="auth-form-link">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <FormError>{formError}</FormError>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
