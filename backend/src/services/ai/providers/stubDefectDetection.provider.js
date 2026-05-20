const stubDetectionsByType = {
  crack: {
    type: "crack",
    severity: "medium",
    confidence: 0.78,
    box: { x: 80, y: 120, w: 280, h: 60 },
    notes: "Stub detection: possible crack-like defect."
  },
  damp: {
    type: "damp",
    severity: "medium",
    confidence: 0.74,
    box: { x: 60, y: 90, w: 240, h: 160 },
    notes: "Stub detection: possible damp patch."
  },
  mould: {
    type: "mould",
    severity: "high",
    confidence: 0.82,
    box: { x: 120, y: 80, w: 180, h: 140 },
    notes: "Stub detection: possible mould growth."
  },
  poor_finish: {
    type: "poor_finish",
    severity: "low",
    confidence: 0.51,
    box: { x: 40, y: 60, w: 200, h: 120 },
    notes: "Stub detection: possible poor finish."
  }
};

const selectStubDetection = (imageUrl = "") => {
  const normalizedUrl = imageUrl.toLowerCase();

  if (normalizedUrl.includes("crack")) {
    return stubDetectionsByType.crack;
  }

  if (normalizedUrl.includes("damp")) {
    return stubDetectionsByType.damp;
  }

  if (normalizedUrl.includes("mould") || normalizedUrl.includes("mold")) {
    return stubDetectionsByType.mould;
  }

  return stubDetectionsByType.poor_finish;
};

const detectDefectsWithStub = async (input) => ({
  modelVersion: "defect-stub-v1",
  provider: "stub",
  detections: [{ ...selectStubDetection(input?.imageUrl) }]
});

module.exports = {
  detectDefectsWithStub
};
