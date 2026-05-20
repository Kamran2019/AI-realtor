const CameraCapture = ({ disabled = false, onCapture }) => {
  const handleChange = (event) => {
    const [file] = event.target.files || [];

    if (file) {
      onCapture(file);
    }

    event.target.value = "";
  };

  return (
    <label className="camera-capture">
      <span>Upload or capture image</span>
      <input
        accept="image/*"
        capture="environment"
        disabled={disabled}
        onChange={handleChange}
        type="file"
      />
    </label>
  );
};

export default CameraCapture;
