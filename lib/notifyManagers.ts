import { sendIncidentEmail } from './resend';
import { supabaseAdmin } from './supabaseAdmin';
import type { Incident, RiskLabel } from './types';

type NotifyPayload = {
  incident: Pick<Incident, 'id' | 'location' | 'description' | 'final_risk_label'>;
  source?: 'NEW_INCIDENT' | 'ESCALATION';
};

const HIGH_RISK: RiskLabel[] = ['Ernstig', 'Onaanvaardbaar'];

function parseExtraRecipients() {
  const raw = process.env.INCIDENT_ALERT_RECIPIENTS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function notifyManagers({ incident, source = 'ESCALATION' }: NotifyPayload) {
  const isHighRisk = Boolean(incident.final_risk_label && HIGH_RISK.includes(incident.final_risk_label));

  const { data: managers, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('role', 'manager');

  if (error) throw error;
  const managerRows = managers || [];

  const title = isHighRisk ? `Hoog risico incident: ${incident.final_risk_label}` : `Nieuw incident: ${incident.location}`;
  const message = isHighRisk
    ? `Locatie: ${incident.location}`
    : `Nieuw incident ontvangen op locatie: ${incident.location}`;

  if (isHighRisk) {
    const notificationRows = managerRows.map((manager) => ({
      user_id: manager.id,
      incident_id: incident.id,
      title,
      message,
      read: false,
    }));

    if (notificationRows.length) {
      const { error: insertError } = await supabaseAdmin.from('notifications').insert(notificationRows);
      if (insertError) throw insertError;
    }
  }

  const managerEmails = managerRows
    .map((manager) => manager.email)
    .filter((email): email is string => Boolean(email))
    .map((email) => email.trim().toLowerCase());

  const extraRecipients = parseExtraRecipients()
    .map((email) => email.toLowerCase())
    .filter((email) => !managerEmails.includes(email));

  const allRecipients = [...managerEmails, ...extraRecipients];

  const subject =
    source === 'NEW_INCIDENT'
      ? `[Horeca-AI] Nieuw incident - ${incident.location}`
      : `[Horeca-AI] Hoog risico incident - ${incident.location}`;

  if (allRecipients.length) {
    await Promise.allSettled(
      allRecipients.map((email) =>
        sendIncidentEmail({
          to: email,
          location: incident.location,
          description: incident.description,
          finalRiskLabel: incident.final_risk_label,
          subject,
        }),
      ),
    );
  }
}
