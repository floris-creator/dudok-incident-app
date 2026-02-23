import type { RiskLabel } from './types';

const keywordScores: Array<{ pattern: RegExp; weight: number }> = [
  { pattern: /brand|vuur|fire|rook|smoke|explosie|explosion/i, weight: 8 },
  { pattern: /gaslek|lekkage|chemical|chemisch|kortsluiting/i, weight: 7 },
  { pattern: /gewond|hospital|ambulance|bloeding|bewusteloos/i, weight: 7 },
  { pattern: /elektra|slip|val|agressie|vechtpartij|diefstal/i, weight: 4 },
  { pattern: /natte vloer|hitte|verbranding|defect|storing/i, weight: 3 },
];

export function scoreToRiskLabel(score: number): RiskLabel {
  if (score <= 4) return 'Laag';
  if (score <= 9) return 'Matig';
  if (score <= 14) return 'Ernstig';
  return 'Onaanvaardbaar';
}

export function riskRank(label: RiskLabel | null): number {
  if (label === 'Laag') return 1;
  if (label === 'Matig') return 2;
  if (label === 'Ernstig') return 3;
  if (label === 'Onaanvaardbaar') return 4;
  return 0;
}

export function calculateIncidentRisk(input: { location: string; description: string }) {
  const text = `${input.location} ${input.description}`.trim();
  let score = 1;

  for (const rule of keywordScores) {
    if (rule.pattern.test(text)) {
      score += rule.weight;
    }
  }

  if (input.description.length > 400) {
    score += 2;
  }

  const cappedScore = Math.max(1, Math.min(score, 20));
  return {
    score: cappedScore,
    label: scoreToRiskLabel(cappedScore),
  };
}
