const FormError = ({ id, children }) => {
  if (!children) {
    return null;
  }

  return (
    <p className="form-error" id={id} role="alert">
      {children}
    </p>
  );
};

export default FormError;
