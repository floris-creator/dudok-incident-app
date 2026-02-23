'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function ReportPage() {
  const router = useRouter();
  const [reporterName, setReporterName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/incidents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporter_name: reporterName, location, description }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Er ging iets mis.');
      }

      router.push('/report/thanks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: '28px auto', padding: '0 clamp(16px, 4vw, 24px)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
        <img src="/dudok_logo.svg" alt="Dudok logo" style={{ width: 128, height: 'auto', display: 'block' }} />
      </div>
      <section
        style={{
          padding: 20,
          background: 'var(--surface)',
          border: '1px solid var(--brand-100)',
          borderRadius: 14,
          boxShadow: '0 8px 24px rgba(23, 62, 67, 0.06)',
        }}
      >
        <h1 style={{ marginTop: 0, color: '#000000', fontSize: 'clamp(16px, 2.8vw, 18px)', fontWeight: 600 }}>
          Incident melden
        </h1>
        <p style={{ color: 'var(--muted)' }}>Vul locatie en omschrijving in. Je hebt geen account nodig.</p>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <label style={{ fontSize: 'clamp(16px, 2.8vw, 18px)', fontWeight: 600 }}>
            Naam (optioneel)
            <input
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              maxLength={120}
              style={{
                width: '100%',
                padding: '14px 12px',
                marginTop: 6,
                fontSize: 'clamp(16px, 3.6vw, 18px)',
                lineHeight: 1.4,
                minHeight: 50,
                borderRadius: 8,
                border: '1px solid var(--brand-100)',
                background: '#fbfdfd',
              }}
            />
          </label>

          <label style={{ fontSize: 'clamp(16px, 2.8vw, 18px)', fontWeight: 600 }}>
            Locatie
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              maxLength={200}
              style={{
                width: '100%',
                padding: '14px 12px',
                marginTop: 6,
                fontSize: 'clamp(16px, 3.6vw, 18px)',
                lineHeight: 1.4,
                minHeight: 50,
                borderRadius: 8,
                border: '1px solid var(--brand-100)',
                background: '#fbfdfd',
              }}
            />
          </label>

          <label style={{ fontSize: 'clamp(16px, 2.8vw, 18px)', fontWeight: 600 }}>
            Omschrijving
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={4000}
              rows={8}
              style={{
                width: '100%',
                padding: '14px 12px',
                marginTop: 6,
                fontSize: 'clamp(16px, 3.6vw, 18px)',
                lineHeight: 1.6,
                minHeight: 180,
                borderRadius: 8,
                border: '1px solid var(--brand-100)',
                background: '#fbfdfd',
              }}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '14px 16px',
              width: 230,
              maxWidth: '100%',
              fontSize: 'clamp(16px, 3.6vw, 18px)',
              borderRadius: 8,
              border: 'none',
              background: 'var(--brand-900)',
              color: 'white',
              fontWeight: 700,
            }}
          >
            {submitting ? 'Verzenden...' : 'Incident versturen'}
          </button>

          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
