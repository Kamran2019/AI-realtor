import { useState } from "react";
import { runImageDetection } from "../../services/aiInspectionApi.js";
import AIDetectionResultPanel from "./AIDetectionResultPanel.jsx";

const AIDetectButton = ({
  disabled = false,
  imageIndex,
  inspectionId,
  onDetectionComplete,
  roomId
}) => {
  const [error, setError] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState(null);

  const handleDetection = async () => {
    setError("");
    setResult(null);
    setIsDetecting(true);

    try {
      const response = await runImageDetection({ imageIndex, inspectionId, roomId });
      const detectionResult = response.data.data;

      setResult(detectionResult);
      onDetectionComplete?.(detectionResult);
    } catch (detectionError) {
      setError(detectionError.response?.data?.message || "AI detection could not be completed.");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="ai-detect-control">
      <button
        className="secondary-button"
        disabled={disabled || isDetecting}
        onClick={handleDetection}
        type="button"
      >
        {isDetecting ? "Running..." : "Run AI Detection"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
      <AIDetectionResultPanel result={result} />
    </div>
  );
};

export default AIDetectButton;
