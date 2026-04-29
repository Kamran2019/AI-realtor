import { useState } from "react";
import { Link } from "react-router-dom";
import TextInput from "../../components/forms/TextInput.jsx";
import FormError from "../../components/ui/FormError.jsx";
import { forgotPassword } from "../../services/authApi.js";

const initialFormValues = {
  email: ""
};

const ForgotPasswordPage = () => {
  const [formValues, setFormValues] = useState(initialFormValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
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
    setFormError("");
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
    setFormError(responseData?.message || "Reset request failed. Please try again.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const response = await forgotPassword(formValues);

      setFormValues(initialFormValues);
      setFieldErrors({});
      setSuccessMessage(
        response.data.message || "If an account exists, password reset instructions have been sent."
      );
    } catch (error) {
      applyApiErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page" aria-labelledby="forgot-password-title">
      <div className="auth-panel">
        <p className="eyebrow">Account access</p>
        <h1 id="forgot-password-title">Forgot password</h1>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextInput
            autoComplete="email"
            error={fieldErrors.email}
            id="forgot-password-email"
            label="Email"
            name="email"
            onChange={handleChange}
            type="email"
            value={formValues.email}
          />
          <FormError>{formError}</FormError>
          {successMessage ? <p className="form-success">{successMessage}</p> : null}
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <p className="auth-switch">
          Remembered it? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
