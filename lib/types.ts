export type RiskLabel = 'Laag' | 'Matig' | 'Ernstig' | 'Onaanvaardbaar';

export type IncidentStatus = 'open' | 'in_behandeling' | 'opgelost';

export type Incident = {
  id: string;
  created_at: string;
  reporter_name: string | null;
  location: string;
  description: string;
  status: IncidentStatus;
  ai_risk_score: number | null;
  ai_risk_label: RiskLabel | null;
  manager_risk_label: RiskLabel | null;
  final_risk_label: RiskLabel | null;
  risk_source: 'AI' | 'MANAGER';
};
