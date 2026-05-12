import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormError from "../../components/ui/FormError.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { createInspection } from "../../services/inspectionApi.js";
import { listUsers } from "../../services/userApi.js";

const initialForm = {
  address: "",
  assignedToUserId: "",
  clientEmail: "",
  clientName: "",
  clientPhone: "",
  postcode: "",
  propertyId: ""
};

const compactObject = (value) =>
  Object.entries(value).reduce((cleaned, [key, fieldValue]) => {
    if (fieldValue !== "") {
      cleaned[key] = fieldValue;
    }

    return cleaned;
  }, {});

const InspectionCreatePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const canAssign = ["admin", "sub_admin"].includes(user?.role);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      if (!canAssign) {
        return;
      }

      try {
        const response = await listUsers({ limit: 100, status: "active" });

        if (isMounted) {
          setUsers(response.data.data.users);
        }
      } catch (loadError) {
        if (isMounted) {
          setUsers([]);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [canAssign]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
    setError("");
  };

  const buildPayload = () => ({
    client: compactObject({
      email: form.clientEmail.trim(),
      name: form.clientName.trim(),
      phone: form.clientPhone.trim()
    }),
    propertyRef: compactObject({
      address: form.address.trim(),
      postcode: form.postcode.trim(),
      propertyId: form.propertyId.trim()
    }),
    ...(canAssign && form.assignedToUserId ? { assignedToUserId: form.assignedToUserId } : {})
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await createInspection(buildPayload());

      navigate(`/inspections/${response.data.data.inspection.id}`);
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Inspection could not be created.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="inspection-form-page" aria-labelledby="create-inspection-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Inspections</p>
          <h1 id="create-inspection-title">Create inspection</h1>
        </div>
        <Link to="/inspections">Back to inspections</Link>
      </div>

      <form className="inspection-create-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend>Property</legend>
          <label>
            Address
            <input
              disabled={isSubmitting}
              maxLength="300"
              name="address"
              onChange={handleChange}
              required={!form.propertyId}
              value={form.address}
            />
          </label>
          <label>
            Postcode
            <input disabled={isSubmitting} maxLength="12" name="postcode" onChange={handleChange} value={form.postcode} />
          </label>
          <label>
            Linked property ID
            <input disabled={isSubmitting} name="propertyId" onChange={handleChange} value={form.propertyId} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Client</legend>
          <label>
            Name
            <input disabled={isSubmitting} maxLength="120" name="clientName" onChange={handleChange} value={form.clientName} />
          </label>
          <label>
            Email
            <input disabled={isSubmitting} name="clientEmail" onChange={handleChange} type="email" value={form.clientEmail} />
          </label>
          <label>
            Phone
            <input disabled={isSubmitting} maxLength="30" name="clientPhone" onChange={handleChange} value={form.clientPhone} />
          </label>
        </fieldset>

        {canAssign ? (
          <fieldset>
            <legend>Assignment</legend>
            <label>
              Assigned user
              <select
                disabled={isSubmitting}
                name="assignedToUserId"
                onChange={handleChange}
                value={form.assignedToUserId}
              >
                <option value="">Unassigned</option>
                {users.map((managedUser) => (
                  <option key={managedUser.id} value={managedUser.id}>
                    {managedUser.name} ({managedUser.email})
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
        ) : null}

        <FormError>{error}</FormError>
        <div className="form-actions">
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating..." : "Create inspection"}
          </button>
          <Link className="secondary-button" to="/inspections">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
};

export default InspectionCreatePage;
