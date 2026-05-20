import FormError from "../ui/FormError.jsx";

const TextInput = ({
  autoComplete,
  disabled = false,
  error,
  id,
  label,
  name,
  onChange,
  type = "text",
  value
}) => (
  <div className="field-group">
    <label htmlFor={id}>{label}</label>
    <input
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={Boolean(error)}
      autoComplete={autoComplete}
      disabled={disabled}
      id={id}
      name={name}
      onChange={onChange}
      type={type}
      value={value}
    />
    <FormError id={`${id}-error`}>{error}</FormError>
  </div>
);

export default TextInput;
