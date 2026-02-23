/**
 * AI Risk Assessment Logic
 * Keywords-based scoring. Score ranges map to labels:
 * 1-4 = Laag, 5-9 = Matig, 10-14 = Ernstig, 15+ = Onaanvaardbaar
 */

const HIGH_RISK_KEYWORDS = [
  'brand', 'vuur', 'fire', 'gas', 'lek', 'bloeding', 'bleeding',
  'vergiftiging', 'vergiftigd', 'vergift', 'chemisch', 'chemical',
  'val', 'fall', 'geval', 'gewond', 'injury', 'letsel', 'ziekenhuis',
  'ambulance', 'ongeluk', 'accident', 'slachtoffer', 'victim',
  'allergische reactie', 'anafylaxie', 'anaphylaxis', 'stikken',
];

const MODERATE_RISK_KEYWORDS = [
  'glas', 'glass', 'scherp', 'sharp', 'uitglijden', 'slip',
  'schoonmaak', 'nat', 'wet', 'glad', 'slippery',
  'brandwond', 'burn', 'verbrand', 'elektrisch', 'electrical',
  'uitval', 'stroom', 'power', 'overlast', 'gevaar', 'danger',
];

const LOW_RISK_KEYWORDS = [
  'klein', 'minor', 'licht', 'light', 'cosmetisch',
  'kapot', 'broken', 'defect', 'reparatie', 'repair',
];

export type RiskLabel = 'Laag' | 'Matig' | 'Ernstig' | 'Onaanvaardbaar';

const LABELS: RiskLabel[] = ['Laag', 'Matig', 'Ernstig', 'Onaanvaardbaar'];

export function calculateAIRisk(location: string, description: string): {
  ai_risk_score: number;
  ai_risk_label: RiskLabel;
} {
  const text = `${location} ${description}`.toLowerCase();
  let score = 0;

  for (const kw of HIGH_RISK_KEYWORDS) {
    if (text.includes(kw)) score += 5;
  }
  for (const kw of MODERATE_RISK_KEYWORDS) {
    if (text.includes(kw)) score += 3;
  }
  for (const kw of LOW_RISK_KEYWORDS) {
    if (text.includes(kw)) score += 1;
  }

  // Base score from description length (longer = potentially more serious)
  if (description.length > 200) score += 2;
  if (description.length > 500) score += 3;

  score = Math.min(score, 20);

  let ai_risk_label: RiskLabel;
  if (score >= 15) ai_risk_label = 'Onaanvaardbaar';
  else if (score >= 10) ai_risk_label = 'Ernstig';
  else if (score >= 5) ai_risk_label = 'Matig';
  else ai_risk_label = 'Laag';

  return { ai_risk_score: score, ai_risk_label };
}

export function isHighRisk(label: RiskLabel): boolean {
  return label === 'Ernstig' || label === 'Onaanvaardbaar';
}

export function riskOrder(label: RiskLabel): number {
  const order: Record<RiskLabel, number> = {
    Laag: 1,
    Matig: 2,
    Ernstig: 3,
    Onaanvaardbaar: 4,
  };
  return order[label];
}

export { LABELS };
