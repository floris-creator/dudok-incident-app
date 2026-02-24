import type { RiskLabel } from './types';

type RiskRule = {
  pattern: RegExp;
  weight: number;
  maxHits?: number;
};

const HIGH_IMPACT_RULES: RiskRule[] = [
  { pattern: /brand|vuur|explos|ontplof/g, weight: 10, maxHits: 1 },
  { pattern: /gaslek|koolmonoxide|chemisch|bijtend|toxic|vergiftig/g, weight: 9, maxHits: 1 },
  { pattern: /elektrische? schok|stroomstoot|kortsluiting|elektra.*schok|schok.*elektra/g, weight: 8, maxHits: 1 },
  { pattern: /agressi|geweld|bedreig|vechtpartij|mishandel|wapen|mes|overval/g, weight: 9, maxHits: 1 },
  { pattern: /bewusteloos|reanimatie|ambulance|seh|ziekenhuis|ehbo|112/g, weight: 7, maxHits: 2 },
];

const INJURY_AND_EVENT_RULES: RiskRule[] = [
  { pattern: /verbrand|brandwond|frituurvet|kokend|heet water|hete soep/g, weight: 7, maxHits: 2 },
  { pattern: /hoofdletsel|hersenschudding|botbreuk|gebroken|fractuur|ernstig letsel/g, weight: 7, maxHits: 1 },
  { pattern: /snijwond|snee|bloeding|bloedde|hecht/g, weight: 4, maxHits: 2 },
  { pattern: /uitgegleden|uitglijd|gestruikel|struikel|gevallen|valpartij|ten val/g, weight: 5, maxHits: 2 },
  { pattern: /bekneld|opgesloten|vastgezet|klem/g, weight: 6, maxHits: 1 },
  { pattern: /geraakt door|aangereden|aanrijding|botsing|vallend voorwerp|rolcontainer/g, weight: 6, maxHits: 1 },
  { pattern: /rookontwikkeling|stank|lekkage|defect|storing/g, weight: 3, maxHits: 2 },
];

const MITIGATING_RULES: RiskRule[] = [
  { pattern: /bijna|net op tijd|zonder letsel|geen letsel|niemand gewond|geen gewonden/g, weight: 2, maxHits: 2 },
  { pattern: /lichte klachten|kleine snee|oppervlakkig|snel gekoeld|direct schoongemaakt/g, weight: 1, maxHits: 2 },
];

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMatches(text: string, pattern: RegExp) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);

  let count = 0;
  while (regex.exec(text) !== null) {
    count += 1;
    if (count > 100) break;
  }
  return count;
}

function applyRules(text: string, rules: RiskRule[]) {
  let score = 0;
  for (const rule of rules) {
    const hits = countMatches(text, rule.pattern);
    if (!hits) continue;

    const cappedHits = rule.maxHits ? Math.min(hits, rule.maxHits) : hits;
    score += cappedHits * rule.weight;
  }
  return score;
}

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
  const text = normalizeText(`${input.location} ${input.description}`);
  let score = 1;

  score += applyRules(text, HIGH_IMPACT_RULES);
  score += applyRules(text, INJURY_AND_EVENT_RULES);
  score -= applyRules(text, MITIGATING_RULES);

  if (/meerdere (medewerkers|gasten|personen)|meerdere gewond/.test(text)) {
    score += 4;
  }

  const hasCriticalBodyPart = /(gezicht|hals|ogen|hoofd)/.test(text);
  const hasBurnOrCut = /verbrand|brandwond|frituurvet|kokend|snijwond|bloeding|snee/.test(text);
  if (hasCriticalBodyPart && hasBurnOrCut) {
    score += 3;
  }

  if (input.description.length > 450) score += 2;

  const cappedScore = Math.max(1, Math.min(Math.round(score), 20));
  return {
    score: cappedScore,
    label: scoreToRiskLabel(cappedScore),
  };
}
