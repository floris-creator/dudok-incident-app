import { Resend } from 'resend';

type IncidentMailInput = {
  to: string;
  location: string;
  description: string;
  finalRiskLabel: string | null;
  subject: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendIncidentEmail(input: IncidentMailInput) {
  if (!resend || !fromEmail) {
    return;
  }

  const html = `
    <p>Er is een incident gemeld met risico: <strong>${input.finalRiskLabel ?? 'Onbekend'}</strong></p>
    <p><strong>Locatie:</strong> ${input.location}</p>
    <p><strong>Omschrijving:</strong> ${input.description}</p>
    <p><a href="${appUrl}/manager/incidents">Bekijk het in het dashboard</a></p>
  `;

  await resend.emails.send({
    from: fromEmail,
    to: input.to,
    subject: input.subject,
    html,
  });
}
