const categoryLabels = {
  high_potential: "High potential",
  solid: "Solid",
  watch: "Watch",
  risky: "Risky",
  unknown: "Unknown"
};

const DealScoreBadge = ({ scoring, size = "default" }) => {
  const category = scoring?.category || "unknown";
  const score = scoring?.total;
  const label = score === null || score === undefined ? "TBC" : `${score}`;

  return (
    <span className={`deal-score-badge ${category} ${size}`} title={categoryLabels[category] || "Unknown"}>
      <strong>{label}</strong>
      <span>{categoryLabels[category] || "Unknown"}</span>
    </span>
  );
};

export default DealScoreBadge;
