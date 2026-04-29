import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TextInput from "../../components/forms/TextInput.jsx";
import FormError from "../../components/ui/FormError.jsx";
import { resetPassword } from "../../services/authApi.js";

const initialFormValues = {
  password: "",
  confirmPassword: ""
};

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [formValues, setFormValues] = useState(initialFormValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(token ? "" : "Reset token is missing.");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setFormError(token ? "" : "Reset token is missing.");
    setSuccessMessage("");
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
    setFormError(responseData?.message || "Password reset failed. Please try again.");
  };

  const validateForm = () => {
    if (!token) {
      setFormError("Reset token is missing.");
      return false;
    }

    if (formValues.password !== formValues.confirmPassword) {
      setFieldErrors({
        confirmPassword: "Passwords must match"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        token,
        password: formValues.password
      });

      setFormValues(initialFormValues);
      setFieldErrors({});
      setSuccessMessage(response.data.message || "Password reset successfully.");
    } catch (error) {
      applyApiErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page" aria-labelledby="reset-password-title">
      <div className="auth-panel">
        <p className="eyebrow">Account access</p>
        <h1 id="reset-password-title">Reset password</h1>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextInput
            autoComplete="new-password"
            error={fieldErrors.password}
            id="reset-password-password"
            label="New password"
            name="password"
            onChange={handleChange}
            type="password"
            value={formValues.password}
          />
          <TextInput
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            id="reset-password-confirm"
            label="Confirm password"
            name="confirmPassword"
            onChange={handleChange}
            type="password"
            value={formValues.confirmPassword}
          />
          <FormError>{formError}</FormError>
          {successMessage ? <p className="form-success">{successMessage}</p> : null}
          <button className="primary-button" disabled={isSubmitting || !token} type="submit">
            {isSubmitting ? "Resetting..." : "Reset password"}
          </button>
        </form>
        <p className="auth-switch">
          Ready to continue? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
