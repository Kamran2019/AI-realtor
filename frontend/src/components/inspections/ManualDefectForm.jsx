import { useEffect, useMemo, useState } from "react";

const defectTypes = [
  ["crack", "Crack"],
  ["damp", "Damp"],
  ["mould", "Mould"],
  ["poor_finish", "Poor finish"],
  ["structural_issue", "Structural issue"],
  ["peeling_paint", "Peeling paint"],
  ["water_seepage", "Water seepage"],
  ["stain", "Stain"],
  ["wall_hole", "Wall hole"],
  ["tile_damage", "Tile damage"],
  ["manual_other", "Other"]
];

const severities = [
  ["low", "Low"],
  ["medium", "Medium"],
  ["high", "High"]
];

const emptyForm = {
  boxH: "",
  boxW: "",
  boxX: "",
  boxY: "",
  imageUrl: "",
  notes: "",
  severity: "low",
  type: "crack"
};

const getInitialForm = (defect) => ({
  ...emptyForm,
  boxH: defect?.box?.h ?? "",
  boxW: defect?.box?.w ?? "",
  boxX: defect?.box?.x ?? "",
  boxY: defect?.box?.y ?? "",
  imageUrl: defect?.imageUrl || "",
  notes: defect?.notes || "",
  severity: defect?.severity || "low",
  type: defect?.type || "crack"
});

const compactPayload = (form) => {
  const payload = {
    severity: form.severity,
    type: form.type,
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    ...(form.imageUrl ? { imageUrl: form.imageUrl } : {})
  };
  const boxEntries = [
    ["x", form.boxX],
    ["y", form.boxY],
    ["w", form.boxW],
    ["h", form.boxH]
  ].filter(([, value]) => value !== "");

  if (boxEntries.length) {
    payload.box = Object.fromEntries(boxEntries.map(([key, value]) => [key, Number(value)]));
  }

  return payload;
};

const ManualDefectForm = ({
  defect = null,
  isSubmitting = false,
  mediaUrls = [],
  onCancel,
  onSubmit,
  submitLabel = "Add defect"
}) => {
  const [form, setForm] = useState(() => getInitialForm(defect));

  useEffect(() => {
    setForm(getInitialForm(defect));
  }, [defect]);

  const imageOptions = useMemo(() => mediaUrls.filter(Boolean), [mediaUrls]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(compactPayload(form));

    if (!defect) {
      setForm(emptyForm);
    }
  };

  return (
    <form className="manual-defect-form" onSubmit={handleSubmit}>
      <label>
        Type
        <select disabled={isSubmitting} name="type" onChange={handleChange} value={form.type}>
          {defectTypes.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Severity
        <select disabled={isSubmitting} name="severity" onChange={handleChange} value={form.severity}>
          {severities.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="wide-field">
        Image
        <select disabled={isSubmitting || !imageOptions.length} name="imageUrl" onChange={handleChange} value={form.imageUrl}>
          <option value="">No linked image</option>
          {imageOptions.map((url, index) => (
            <option key={url} value={url}>
              Image {index + 1}
            </option>
          ))}
        </select>
      </label>

      <label className="wide-field">
        Notes
        <textarea
          disabled={isSubmitting}
          maxLength="3000"
          name="notes"
          onChange={handleChange}
          rows="3"
          value={form.notes}
        />
      </label>

      <div className="defect-box-grid wide-field">
        <label>
          X
          <input disabled={isSubmitting} name="boxX" onChange={handleChange} step="0.01" type="number" value={form.boxX} />
        </label>
        <label>
          Y
          <input disabled={isSubmitting} name="boxY" onChange={handleChange} step="0.01" type="number" value={form.boxY} />
        </label>
        <label>
          W
          <input disabled={isSubmitting} name="boxW" onChange={handleChange} step="0.01" type="number" value={form.boxW} />
        </label>
        <label>
          H
          <input disabled={isSubmitting} name="boxH" onChange={handleChange} step="0.01" type="number" value={form.boxH} />
        </label>
      </div>

      <div className="form-actions wide-field">
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel ? (
          <button className="secondary-button" disabled={isSubmitting} onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
};

export default ManualDefectForm;
