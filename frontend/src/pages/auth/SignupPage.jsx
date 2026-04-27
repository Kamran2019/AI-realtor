import { useState } from "react";
import TextInput from "../../components/forms/TextInput.jsx";
import FormError from "../../components/ui/FormError.jsx";
import { signup } from "../../services/authApi.js";

const initialFormValues = {
  name: "",
  email: "",
  password: ""
};

const SignupPage = () => {
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
    setFormError(responseData?.message || "Signup failed. Please try again.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const response = await signup(formValues);

      setFormValues(initialFormValues);
      setFieldErrors({});
      setSuccessMessage(response.data.message || "Account created successfully.");
    } catch (error) {
      applyApiErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page" aria-labelledby="signup-title">
      <div className="auth-panel">
        <p className="eyebrow">Create account</p>
        <h1 id="signup-title">Sign up</h1>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextInput
            autoComplete="name"
            error={fieldErrors.name}
            id="signup-name"
            label="Name"
            name="name"
            onChange={handleChange}
            value={formValues.name}
          />
          <TextInput
            autoComplete="email"
            error={fieldErrors.email}
            id="signup-email"
            label="Email"
            name="email"
            onChange={handleChange}
            type="email"
            value={formValues.email}
          />
          <TextInput
            autoComplete="new-password"
            error={fieldErrors.password}
            id="signup-password"
            label="Password"
            name="password"
            onChange={handleChange}
            type="password"
            value={formValues.password}
          />
          <FormError>{formError}</FormError>
          {successMessage ? <p className="form-success">{successMessage}</p> : null}
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default SignupPage;
