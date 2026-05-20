import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TextInput from "../../components/forms/TextInput.jsx";
import FormError from "../../components/ui/FormError.jsx";
import { createUser, getUser, updateUser } from "../../services/userApi.js";

const createInitialValues = {
  name: "",
  email: "",
  password: "",
  role: "user",
  status: "active"
};

const UserFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [formValues, setFormValues] = useState(createInitialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      return undefined;
    }

    let isMounted = true;

    const loadUser = async () => {
      setIsLoading(true);
      setFormError("");

      try {
        const response = await getUser(id);
        const loadedUser = response.data.data.user;

        if (isMounted) {
          setFormValues({
            name: loadedUser.name || "",
            email: loadedUser.email || "",
            password: "",
            role: loadedUser.role || "user",
            status: loadedUser.status === "disabled" ? "disabled" : "active"
          });
        }
      } catch (error) {
        if (isMounted) {
          setFormError(error.response?.data?.message || "User could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

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
    setFormError(responseData?.message || "User could not be saved.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      if (isEditing) {
        const updatePayload = {
          name: formValues.name,
          status: formValues.status
        };

        if (formValues.role !== "admin") {
          updatePayload.role = formValues.role;
        }

        await updateUser(id, updatePayload);
        setSuccessMessage("User updated.");
      } else {
        await createUser({
          name: formValues.name,
          email: formValues.email,
          password: formValues.password,
          role: formValues.role
        });
        navigate("/admin/users", { replace: true });
      }
    } catch (error) {
      applyApiErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-page" aria-labelledby="user-form-title">
      <p className="eyebrow">Admin</p>
      <h1 id="user-form-title">{isEditing ? "Edit user" : "Create user"}</h1>
      <p className="auth-switch">
        <Link to="/admin/users">Back to users</Link>
      </p>

      {isLoading ? (
        <p className="route-status">Loading user...</p>
      ) : (
        <form className="auth-form user-form" onSubmit={handleSubmit} noValidate>
          <TextInput
            autoComplete="name"
            error={fieldErrors.name}
            id="user-name"
            label="Name"
            name="name"
            onChange={handleChange}
            value={formValues.name}
          />
          <TextInput
            autoComplete="email"
            error={fieldErrors.email}
            disabled={isEditing}
            id="user-email"
            label="Email"
            name="email"
            onChange={handleChange}
            type="email"
            value={formValues.email}
          />
          {!isEditing ? (
            <TextInput
              autoComplete="new-password"
              error={fieldErrors.password}
              id="user-password"
              label="Password"
              name="password"
              onChange={handleChange}
              type="password"
              value={formValues.password}
            />
          ) : null}
          <div className="field-group">
            <label htmlFor="user-role">Role</label>
            <select id="user-role" name="role" onChange={handleChange} value={formValues.role}>
              {isEditing && formValues.role === "admin" ? (
                <option disabled value="admin">
                  Admin
                </option>
              ) : null}
              <option value="user">User</option>
              <option value="sub_admin">Sub admin</option>
            </select>
            <FormError id="user-role-error">{fieldErrors.role}</FormError>
          </div>
          {isEditing ? (
            <div className="field-group">
              <label htmlFor="user-status">Status</label>
              <select
                id="user-status"
                name="status"
                onChange={handleChange}
                value={formValues.status}
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <FormError id="user-status-error">{fieldErrors.status}</FormError>
            </div>
          ) : null}
          <FormError>{formError}</FormError>
          {successMessage ? <p className="form-success">{successMessage}</p> : null}
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving..." : "Save user"}
          </button>
        </form>
      )}
    </section>
  );
};

export default UserFormPage;
