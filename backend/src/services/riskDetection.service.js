const MAX_TEXT_LENGTH = 120000;

const RISK_RULES = [
  {
    key: "subsidence",
    severity: "high",
    label: "subsidence",
    patterns: [/\bsubsidence\b/i, /\bsubsided\b/i]
  },
  {
    key: "structural_movement",
    severity: "high",
    label: "structural movement",
    patterns: [
      /\bstructural movement\b/i,
      /\bfoundation movement\b/i,
      /\bstructural defect\b/i,
      /\bmovement (?:has been |is )?(?:noted|observed|recorded)\b/i
    ]
  },
  {
    key: "damp",
    severity: "medium",
    label: "damp",
    patterns: [/\brising damp\b/i, /\bpenetrating damp\b/i, /\bdamp\b/i, /\bmould\b/i]
  },
  {
    key: "flood_risk",
    severity: "high",
    label: "flood risk",
    patterns: [
      /\bflood risk\b/i,
      /\bflood zone\b/i,
      /\brisk of flooding\b/i,
      /\bsurface water flooding\b/i
    ]
  },
  {
    key: "planning_restriction",
    severity: "medium",
    label: "planning restriction",
    patterns: [
      /\bplanning (?:restriction|condition|constraint)s?\b/i,
      /\brestrictive covenant\b/i,
      /\barticle 4 direction\b/i,
      /\bsection 106\b/i
    ]
  },
  {
    key: "non_standard_construction",
    severity: "medium",
    label: "non-standard construction",
    patterns: [
      /\bnon[-\s]?standard construction\b/i,
      /\bprefabricated concrete\b/i,
      /\bconcrete panel\b/i,
      /\bsteel framed?\b/i,
      /\btimber framed?\b/i,
      /\bmundic\b/i,
      /\bbisf\b/i,
      /\bwimpey no[-\s]?fines\b/i
    ]
  }
];

const SHORT_LEASE_PATTERNS = [
  /\b(?:unexpired\s+)?(?:lease\s+)?(?:term|lease|remaining|unexpired)[^\d]{0,40}(\d{1,3})\s*(?:years|yrs)\b/i,
  /\b(\d{1,3})\s*(?:years|yrs)\s+(?:remaining|unexpired|left|lease)\b/i,
  /\bleasehold[^\d]{0,40}(\d{1,3})\s*(?:years|yrs)\b/i
];

const sanitizeText = (text = "") =>
  String(text)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);

const detectShortLease = (text) => {
  for (const pattern of SHORT_LEASE_PATTERNS) {
    const match = text.match(pattern);
    const years = match ? Number(match[1]) : null;

    if (Number.isFinite(years) && years > 0 && years < 80) {
      return {
        key: "short_lease",
        severity: "high",
        note: `Lease term appears to be ${years} years, below the 80 year threshold.`
      };
    }
  }

  return null;
};

const detectRuleRisk = (text, rule) => {
  const matched = rule.patterns.some((pattern) => pattern.test(text));

  if (!matched) {
    return null;
  }

  return {
    key: rule.key,
    severity: rule.severity,
    note: `Matched legal pack wording for ${rule.label}.`
  };
};

const detectRisks = (text = "") => {
  const sanitizedText = sanitizeText(text);
  const risks = [detectShortLease(sanitizedText), ...RISK_RULES.map((rule) => detectRuleRisk(sanitizedText, rule))]
    .filter(Boolean);

  return risks;
};

module.exports = {
  detectRisks,
  sanitizeText
};
