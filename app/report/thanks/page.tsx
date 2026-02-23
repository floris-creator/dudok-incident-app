export default function ReportThanksPage() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: '40px auto',
        padding: 24,
        background: 'var(--surface)',
        border: '1px solid var(--brand-100)',
        borderRadius: 14,
        boxShadow: '0 8px 24px rgba(23, 62, 67, 0.06)',
      }}
    >
      <h1 style={{ marginTop: 0, color: 'var(--brand-900)' }}>Bedankt voor je melding!</h1>
      <p style={{ color: 'var(--muted)' }}>Je incident is ontvangen en wordt beoordeeld.</p>
    </main>
  );
}
