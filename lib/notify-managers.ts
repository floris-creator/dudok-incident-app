import { createAdminClient } from './supabase/admin';
import { sendIncidentEmail } from './resend';
import type { RiskLabel } from './types';

/**
 * Notify all managers about a high-risk incident.
 * 1) Insert in-app notification for each manager
 * 2) Send email via Resend to each manager with email
 */
export async function notifyManagers(
  incident: {
    id: string;
    location: string;
    description: string;
    final_risk_label: RiskLabel;
  },
  _baseUrl: string
): Promise<{ notificationsCreated: number; emailsSent: number; errors: string[] }> {
  const supabase = createAdminClient();
  const errors: string[] = [];
  let notificationsCreated = 0;
  let emailsSent = 0;

  // 1) Fetch all managers
  const { data: managers, error: managersError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'manager');

  if (managersError) {
    errors.push(`Failed to fetch managers: ${managersError.message}`);
    return { notificationsCreated: 0, emailsSent: 0, errors };
  }

  if (!managers?.length) {
    return { notificationsCreated: 0, emailsSent: 0, errors };
  }

  const title = `Hoog risico incident: ${incident.location}`;
  const message = `Risico: ${incident.final_risk_label}. ${incident.description.slice(0, 150)}${incident.description.length > 150 ? '...' : ''}`;

  // 2) Insert in-app notification for each manager
  for (const manager of managers) {
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: manager.id,
      incident_id: incident.id,
      title,
      message,
    });
    if (notifError) {
      errors.push(`Notification for ${manager.id}: ${notifError.message}`);
    } else {
      notificationsCreated++;
    }
  }

  // 3) Send email via Resend to each manager with email
  const recipients = managers.map((manager) => manager.email).filter((email): email is string => Boolean(email));
  const subject = `[Horeca-AI] Hoog risico incident - ${incident.location}`;

  const mailResults = await Promise.allSettled(
    recipients.map((email) =>
      sendIncidentEmail({
        to: email,
        location: incident.location,
        description: incident.description,
        finalRiskLabel: incident.final_risk_label,
        subject,
      }),
    ),
  );

  emailsSent = mailResults.filter((result) => result.status === 'fulfilled').length;
  mailResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      errors.push(`Email to ${recipients[index]}: ${String(result.reason)}`);
    }
  });

  return { notificationsCreated, emailsSent, errors };
}
