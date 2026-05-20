const formatConfidence = (value) => {
  if (typeof value !== "number") {
    return "Not reported";
  }

  return `${Math.round(value * 100)}%`;
};

const getDetections = (result) => result?.defects || result?.detections || [];

const AIDetectionResultPanel = ({ result }) => {
  if (!result) {
    return null;
  }

  const detections = getDetections(result);
  const confidenceValues = detections
    .map((detection) => detection.confidence)
    .filter((confidence) => typeof confidence === "number");
  const confidence = confidenceValues.length ? Math.max(...confidenceValues) : null;

  return (
    <div className="ai-result-panel" role="status">
      <dl>
        <div>
          <dt>Model</dt>
          <dd>{result.modelVersion || "Not reported"}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd>{result.provider || "Not reported"}</dd>
        </div>
        <div>
          <dt>Detections</dt>
          <dd>{detections.length}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{formatConfidence(confidence)}</dd>
        </div>
      </dl>
      <p>AI suggestions must be reviewed by a human.</p>
    </div>
  );
};

export default AIDetectionResultPanel;
