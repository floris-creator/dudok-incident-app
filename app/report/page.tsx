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
  const [touched, setTouched] = useState<{ location: boolean; description: boolean }>({
    location: false,
    description: false,
  });

  const locationError = touched.location && location.trim().length === 0 ? 'Locatie is verplicht.' : null;
  const descriptionError =
    touched.description && description.trim().length < 20 ? 'Omschrijf het incident met minimaal 20 tekens.' : null;

  const canSubmit = location.trim().length > 0 && description.trim().length >= 20;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ location: true, description: true });
    if (!canSubmit) return;

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
        <p style={{ color: 'var(--muted)', marginBottom: 6 }}>Vul locatie en omschrijving in. Je hebt geen account nodig.</p>

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
              onBlur={() => setTouched((prev) => ({ ...prev, location: true }))}
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
            {locationError ? <span style={{ display: 'block', marginTop: 6, color: '#b91c1c', fontSize: 14 }}>{locationError}</span> : null}
          </label>

          <label style={{ fontSize: 'clamp(16px, 2.8vw, 18px)', fontWeight: 600 }}>
            Omschrijving
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
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
            <span style={{ display: 'block', marginTop: 6, color: 'var(--muted)', fontSize: 14 }}>
              {description.trim().length}/4000 tekens (min. 20)
            </span>
            {descriptionError ? <span style={{ display: 'block', marginTop: 4, color: '#b91c1c', fontSize: 14 }}>{descriptionError}</span> : null}
          </label>

          <button
            type="submit"
            disabled={submitting || !canSubmit}
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
