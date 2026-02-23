import Link from 'next/link';

export default function ReportThanksPage() {
  return (
    <main style={{ maxWidth: 760, margin: '28px auto', padding: '0 clamp(16px, 4vw, 24px)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
        <img src="/dudok_logo.svg" alt="Dudok logo" style={{ width: 128, height: 'auto', display: 'block' }} />
      </div>
      <section
        style={{
          padding: 24,
          background: 'var(--surface)',
          border: '1px solid var(--brand-100)',
          borderRadius: 14,
          boxShadow: '0 8px 24px rgba(23, 62, 67, 0.06)',
        }}
      >
        <h1 style={{ marginTop: 0, color: 'var(--brand-900)' }}>Bedankt voor je melding!</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Je incident is ontvangen en wordt beoordeeld door het managerteam.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/report"
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--brand-900)',
              color: 'white',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Nieuwe melding doen
          </Link>
          <Link
            href="/manager/login"
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--brand-100)',
              color: 'var(--brand-900)',
              fontWeight: 700,
              textDecoration: 'none',
              background: 'white',
            }}
          >
            Manager login
          </Link>
        </div>
      </section>
    </main>
  );
}
