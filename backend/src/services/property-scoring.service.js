function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculatePropertyScore(property) {
  const guidePrice = Number(property.guidePrice || 0);
  const arvEstimate = Number(property.valuation?.arvEstimate || guidePrice * 1.35);
  const monthlyRentEstimate = Number(
    property.valuation?.monthlyRentEstimate || guidePrice * 0.008
  );
  const refurbCostEstimate = Number(property.valuation?.refurbCostEstimate || guidePrice * 0.08);
  const purchaseCostEstimate = Number(
    property.valuation?.purchaseCostEstimate || guidePrice * 0.05
  );

  const totalCost = guidePrice + refurbCostEstimate + purchaseCostEstimate;
  const annualRent = monthlyRentEstimate * 12;
  const yieldPct = totalCost > 0 ? (annualRent / totalCost) * 100 : 0;
  const roiPct = totalCost > 0 ? ((arvEstimate - totalCost) / totalCost) * 100 : 0;
  const discountPct = arvEstimate > 0 ? ((arvEstimate - guidePrice) / arvEstimate) * 100 : 0;

  const confidenceInputs = [
    property.guidePrice,
    property.valuation?.arvEstimate,
    property.valuation?.monthlyRentEstimate,
  ].filter(Boolean).length;
  const confidence = clamp(confidenceInputs / 3, 0.3, 1);

  const riskPenalty = (property.risks?.redFlags?.length || 0) * 6;
  const score = clamp(
    discountPct * 0.8 + yieldPct * 3 + roiPct * 0.6 + confidence * 18 - riskPenalty,
    0,
    100
  );

  return {
    score: Number(score.toFixed(2)),
    yieldPct: Number(yieldPct.toFixed(2)),
    roiPct: Number(roiPct.toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
    modelVersion: "deal-v1",
    computedAt: new Date(),
  };
}

module.exports = {
  calculatePropertyScore,
};

