import { useEffect, useState } from "react";
import FormError from "../../components/ui/FormError.jsx";
import {
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  updateAlertRule
} from "../../services/alertApi.js";

const emptyForm = {
  channelEmail: false,
  channelInApp: true,
  isEnabled: true,
  maxPrice: "",
  maxScore: "",
  maxYield: "",
  minPrice: "",
  minScore: "",
  minYield: "",
  name: "",
  postcodes: "",
  tenure: "",
  type: ""
};

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const toNumberOrUndefined = (value) => {
  if (value === "") {
    return undefined;
  }

  return Number(value);
};

const parsePostcodes = (value) =>
  [
    ...new Set(
      value
        .split(",")
        .map((postcode) => postcode.trim().toUpperCase())
        .filter(Boolean)
    )
  ];

const buildPayload = (form) => {
  const criteria = {};
  const numberFields = ["minScore", "maxScore", "minPrice", "maxPrice", "minYield", "maxYield"];

  numberFields.forEach((field) => {
    const value = toNumberOrUndefined(form[field]);

    if (value !== undefined) {
      criteria[field] = value;
    }
  });

  const postcodes = parsePostcodes(form.postcodes);

  if (postcodes.length) {
    criteria.postcodes = postcodes;
  }

  if (form.type.trim()) {
    criteria.type = form.type.trim();
  }

  if (form.tenure.trim()) {
    criteria.tenure = form.tenure.trim();
  }

  const channels = [
    form.channelInApp ? "in_app" : null,
    form.channelEmail ? "email" : null
  ].filter(Boolean);

  return {
    channels,
    criteria,
    isEnabled: form.isEnabled,
    name: form.name.trim()
  };
};

const hydrateForm = (alertRule) => ({
  channelEmail: alertRule.channels.includes("email"),
  channelInApp: alertRule.channels.includes("in_app"),
  isEnabled: alertRule.isEnabled,
  maxPrice: alertRule.criteria.maxPrice ?? "",
  maxScore: alertRule.criteria.maxScore ?? "",
  maxYield: alertRule.criteria.maxYield ?? "",
  minPrice: alertRule.criteria.minPrice ?? "",
  minScore: alertRule.criteria.minScore ?? "",
  minYield: alertRule.criteria.minYield ?? "",
  name: alertRule.name,
  postcodes: (alertRule.criteria.postcodes || []).join(", "),
  tenure: alertRule.criteria.tenure || "",
  type: alertRule.criteria.type || ""
});

const describeCriteria = (criteria) => {
  const items = [];

  if (criteria.minScore !== null && criteria.minScore !== undefined) {
    items.push(`Score >= ${criteria.minScore}`);
  }

  if (criteria.maxScore !== null && criteria.maxScore !== undefined) {
    items.push(`Score <= ${criteria.maxScore}`);
  }

  if (criteria.minPrice !== null && criteria.minPrice !== undefined) {
    items.push(`Price >= ${criteria.minPrice}`);
  }

  if (criteria.maxPrice !== null && criteria.maxPrice !== undefined) {
    items.push(`Price <= ${criteria.maxPrice}`);
  }

  if (criteria.minYield !== null && criteria.minYield !== undefined) {
    items.push(`Yield >= ${criteria.minYield}%`);
  }

  if (criteria.maxYield !== null && criteria.maxYield !== undefined) {
    items.push(`Yield <= ${criteria.maxYield}%`);
  }

  if (criteria.postcodes?.length) {
    items.push(`Postcodes ${criteria.postcodes.join(", ")}`);
  }

  if (criteria.type) {
    items.push(criteria.type);
  }

  if (criteria.tenure) {
    items.push(criteria.tenure);
  }

  return items;
};

const AlertsPage = () => {
  const [alertRules, setAlertRules] = useState([]);
  const [editingAlertId, setEditingAlertId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadAlerts = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await listAlertRules();

      setAlertRules(response.data.data.alertRules);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Alerts could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const resetForm = () => {
    setEditingAlertId("");
    setForm(emptyForm);
  };

  const handleInputChange = (event) => {
    const { checked, name, type, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
    setStatusMessage("");
  };

  const startEditing = (alertRule) => {
    setEditingAlertId(alertRule.id);
    setForm(hydrateForm(alertRule));
    setError("");
    setStatusMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    setIsSaving(true);

    try {
      const payload = buildPayload(form);
      const response = editingAlertId
        ? await updateAlertRule(editingAlertId, payload)
        : await createAlertRule(payload);
      const savedAlert = response.data.data.alertRule;

      setAlertRules((currentAlerts) => {
        if (!editingAlertId) {
          return [savedAlert, ...currentAlerts];
        }

        return currentAlerts.map((alertRule) =>
          alertRule.id === savedAlert.id ? savedAlert : alertRule
        );
      });
      setStatusMessage(editingAlertId ? "Alert updated." : "Alert created.");
      resetForm();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Alert could not be saved."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (alertRule) => {
    setError("");
    setStatusMessage("");

    try {
      const response = await updateAlertRule(alertRule.id, {
        isEnabled: !alertRule.isEnabled
      });
      const updatedAlert = response.data.data.alertRule;

      setAlertRules((currentAlerts) =>
        currentAlerts.map((listedAlert) =>
          listedAlert.id === updatedAlert.id ? updatedAlert : listedAlert
        )
      );
      setStatusMessage("Alert status updated.");
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Alert status could not be updated."));
    }
  };

  const handleDelete = async (alertRule) => {
    if (!window.confirm(`Delete ${alertRule.name}?`)) {
      return;
    }

    setError("");
    setStatusMessage("");

    try {
      await deleteAlertRule(alertRule.id);
      setAlertRules((currentAlerts) =>
        currentAlerts.filter((listedAlert) => listedAlert.id !== alertRule.id)
      );
      if (editingAlertId === alertRule.id) {
        resetForm();
      }
      setStatusMessage("Alert deleted.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Alert could not be deleted."));
    }
  };

  return (
    <section className="alerts-page" aria-labelledby="alerts-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Alerts</p>
          <h1 id="alerts-title">Rules</h1>
          <p>Track matching listings by score, price, yield, location, type, and tenure.</p>
        </div>
      </div>

      <div className="alerts-layout">
        <form className="alert-form" onSubmit={handleSubmit}>
          <h2>{editingAlertId ? "Edit alert" : "Create alert"}</h2>
          <label>
            Name
            <input name="name" onChange={handleInputChange} value={form.name} />
          </label>
          <div className="criteria-grid">
            <label>
              Min score
              <input
                min="0"
                max="100"
                name="minScore"
                onChange={handleInputChange}
                type="number"
                value={form.minScore}
              />
            </label>
            <label>
              Max score
              <input
                min="0"
                max="100"
                name="maxScore"
                onChange={handleInputChange}
                type="number"
                value={form.maxScore}
              />
            </label>
            <label>
              Min price
              <input min="0" name="minPrice" onChange={handleInputChange} type="number" value={form.minPrice} />
            </label>
            <label>
              Max price
              <input min="0" name="maxPrice" onChange={handleInputChange} type="number" value={form.maxPrice} />
            </label>
            <label>
              Min yield
              <input min="0" name="minYield" onChange={handleInputChange} type="number" value={form.minYield} />
            </label>
            <label>
              Max yield
              <input min="0" name="maxYield" onChange={handleInputChange} type="number" value={form.maxYield} />
            </label>
          </div>
          <label>
            Postcodes
            <input name="postcodes" onChange={handleInputChange} value={form.postcodes} />
          </label>
          <div className="criteria-grid">
            <label>
              Type
              <input name="type" onChange={handleInputChange} value={form.type} />
            </label>
            <label>
              Tenure
              <input name="tenure" onChange={handleInputChange} value={form.tenure} />
            </label>
          </div>
          <div className="alert-channel-row" aria-label="Alert channels">
            <label className="checkbox-row">
              <input
                checked={form.channelInApp}
                name="channelInApp"
                onChange={handleInputChange}
                type="checkbox"
              />
              In-app
            </label>
            <label className="checkbox-row">
              <input
                checked={form.channelEmail}
                name="channelEmail"
                onChange={handleInputChange}
                type="checkbox"
              />
              Email
            </label>
            <label className="checkbox-row">
              <input
                checked={form.isEnabled}
                name="isEnabled"
                onChange={handleInputChange}
                type="checkbox"
              />
              Enabled
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : editingAlertId ? "Update" : "Create"}
            </button>
            {editingAlertId ? (
              <button className="secondary-button" onClick={resetForm} type="button">
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="alerts-list-panel">
          <FormError>{error}</FormError>
          {statusMessage ? <p className="form-success">{statusMessage}</p> : null}

          {isLoading ? (
            <p>Loading alerts...</p>
          ) : alertRules.length ? (
            <div className="alert-list">
              {alertRules.map((alertRule) => (
                <article className="alert-card" key={alertRule.id}>
                  <div className="panel-title-row">
                    <div>
                      <h2>{alertRule.name}</h2>
                      <span className={alertRule.isEnabled ? "status-pill active" : "status-pill"}>
                        {alertRule.isEnabled ? "Enabled" : "Paused"}
                      </span>
                    </div>
                    <div className="table-actions">
                      <button className="text-button" onClick={() => startEditing(alertRule)} type="button">
                        Edit
                      </button>
                      <button className="text-button" onClick={() => handleToggle(alertRule)} type="button">
                        {alertRule.isEnabled ? "Pause" : "Enable"}
                      </button>
                      <button className="text-button danger" onClick={() => handleDelete(alertRule)} type="button">
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="tag-row">
                    {describeCriteria(alertRule.criteria).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <p className="muted-note">
                    {alertRule.channels
                      .map((channel) => (channel === "in_app" ? "In-app" : "Email"))
                      .join(", ")}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p>No alerts configured.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AlertsPage;
