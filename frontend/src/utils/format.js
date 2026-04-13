export function currency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function shortDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString();
}

