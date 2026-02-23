'use client';

import { useMemo, useState } from 'react';

import type { Incident, IncidentStatus, RiskLabel } from '@/lib/types';

const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: 'Open',
  in_behandeling: 'In behandeling',
  opgelost: 'Opgelost',
};

const RISK_COLORS: Record<RiskLabel, string> = {
  Laag: '#15803d',
  Matig: '#a16207',
  Ernstig: '#b91c1c',
  Onaanvaardbaar: '#7f1d1d',
};

type SortKey = 'newest' | 'oldest' | 'risk_desc';

function isHighRisk(label: RiskLabel | null) {
  return label === 'Ernstig' || label === 'Onaanvaardbaar';
}

function riskRank(label: RiskLabel | null) {
  if (label === 'Laag') return 1;
  if (label === 'Matig') return 2;
  if (label === 'Ernstig') return 3;
  if (label === 'Onaanvaardbaar') return 4;
  return 0;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function IncidentsClient({ initialIncidents }: { initialIncidents: Incident[] }) {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modalIncidentId, setModalIncidentId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<RiskLabel>('Laag');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high'>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeIncident = useMemo(
    () => incidents.find((incident) => incident.id === modalIncidentId) || null,
    [incidents, modalIncidentId],
  );

  const visibleIncidents = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = incidents.filter((incident) => {
      if (statusFilter !== 'all' && incident.status !== statusFilter) return false;
      if (riskFilter === 'high' && !isHighRisk(incident.final_risk_label)) return false;

      if (!q) return true;

      const haystack = `${incident.location} ${incident.description} ${incident.reporter_name || ''}`.toLowerCase();
      return haystack.includes(q);
    });

    return filtered.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === 'risk_desc') return riskRank(b.final_risk_label) - riskRank(a.final_risk_label);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [incidents, query, riskFilter, sort, statusFilter]);

  async function patchIncident(id: string, payload: Partial<{ status: IncidentStatus; manager_risk_label: RiskLabel }>) {
    setSavingId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/incidents/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });

      const body = (await res.json().catch(() => null)) as { error?: string; incident?: Incident } | null;
      if (!res.ok || !body?.incident) {
        throw new Error(body?.error || 'Opslaan mislukt');
      }

      setIncidents((prev) => prev.map((item) => (item.id === id ? { ...item, ...body.incident } : item)));
      setModalIncidentId(null);
      setSuccess('Wijziging opgeslagen.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section style={{ display: 'grid', gap: 14, fontSize: 18 }}>
      <section
        style={{
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          padding: 14,
          background: 'var(--surface)',
          border: '1px solid var(--brand-100)',
          borderRadius: 12,
        }}
      >
        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Zoeken
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op locatie, omschrijving of naam"
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--brand-100)' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | IncidentStatus)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--brand-100)' }}
          >
            <option value="all">Alle statussen</option>
            <option value="open">Open</option>
            <option value="in_behandeling">In behandeling</option>
            <option value="opgelost">Afgehandeld</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Risico
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as 'all' | 'high')}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--brand-100)' }}
          >
            <option value="all">Alle risico's</option>
            <option value="high">Alleen hoog risico</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Sortering
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--brand-100)' }}
          >
            <option value="newest">Nieuwste eerst</option>
            <option value="oldest">Oudste eerst</option>
            <option value="risk_desc">Hoogste risico eerst</option>
          </select>
        </label>
      </section>

      {success ? (
        <p style={{ margin: 0, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '8px 10px' }}>
          {success}
        </p>
      ) : null}
      {error ? <p style={{ color: '#b91c1c', fontSize: 18 }}>{error}</p> : null}

      {visibleIncidents.length === 0 ? (
        <article style={{ background: 'var(--surface)', border: '1px solid var(--brand-100)', borderRadius: 12, padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Geen incidenten gevonden</h3>
          <p style={{ marginBottom: 0, color: 'var(--muted)' }}>Pas je filters aan of maak een nieuwe melding.</p>
        </article>
      ) : null}

      {visibleIncidents.map((incident) => {
        const riskLabel = incident.final_risk_label || 'Laag';
        const isExpanded = Boolean(expandedIds[incident.id]);
        const isLongDescription = incident.description.length > 180;
        const description = isExpanded || !isLongDescription ? incident.description : `${incident.description.slice(0, 180)}...`;

        return (
          <article
            key={incident.id}
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: 18,
              border: '1px solid var(--brand-100)',
              boxShadow: '0 6px 16px rgba(23, 62, 67, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 28, lineHeight: 1.2, color: 'var(--brand-900)' }}>{incident.location}</h3>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>{formatDate(incident.created_at)}</span>
            </div>

            {incident.reporter_name ? (
              <p style={{ margin: '8px 0 0', fontSize: 16, color: 'var(--muted)' }}>
                Gemeld door: <strong>{incident.reporter_name}</strong>
              </p>
            ) : null}

            <p style={{ marginTop: 10, marginBottom: 8, whiteSpace: 'pre-wrap', fontSize: 22, lineHeight: 1.55 }}>{description}</p>
            {isLongDescription ? (
              <button
                type="button"
                onClick={() => setExpandedIds((prev) => ({ ...prev, [incident.id]: !isExpanded }))}
                style={{
                  marginBottom: 12,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--brand-900)',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: 15,
                }}
              >
                {isExpanded ? 'Minder tonen' : 'Meer tonen'}
              </button>
            ) : null}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 16, fontWeight: 600 }}>
                Status:{' '}
                <select
                  value={incident.status}
                  onChange={(e) =>
                    patchIncident(incident.id, {
                      status: e.target.value as IncidentStatus,
                    })
                  }
                  disabled={savingId === incident.id}
                  style={{ fontSize: 16, padding: '8px 10px', minHeight: 40, borderRadius: 6, border: '1px solid var(--brand-100)' }}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <span
                style={{
                  display: 'inline-flex',
                  borderRadius: 999,
                  background: RISK_COLORS[riskLabel],
                  color: 'white',
                  padding: '6px 12px',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {riskLabel}
              </span>

              <span style={{ fontSize: 16 }}>{incident.risk_source === 'AI' ? 'Beoordeeld door AI' : 'Beoordeeld door manager'}</span>
            </div>

            <button
              type="button"
              style={{
                marginTop: 12,
                padding: '10px 12px',
                fontSize: 16,
                borderRadius: 8,
                border: 'none',
                background: 'var(--brand-900)',
                color: 'white',
                fontWeight: 700,
              }}
              onClick={() => {
                setSelectedLabel(incident.final_risk_label || 'Laag');
                setModalIncidentId(incident.id);
              }}
            >
              Risico aanpassen
            </button>
          </article>
        );
      })}

      {activeIncident ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 62, 67, 0.45)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: 20,
              width: '100%',
              maxWidth: 520,
              border: '1px solid var(--brand-100)',
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: 28, lineHeight: 1.2, color: 'var(--brand-900)' }}>Risico aanpassen</h3>
            <p style={{ marginTop: 0, marginBottom: 14, fontSize: 18 }}>{activeIncident.location}</p>

            <label style={{ fontSize: 17, fontWeight: 600 }}>
              Label
              <select
                value={selectedLabel}
                onChange={(e) => setSelectedLabel(e.target.value as RiskLabel)}
                style={{
                  display: 'block',
                  marginTop: 8,
                  width: '100%',
                  fontSize: 17,
                  padding: '10px 12px',
                  minHeight: 44,
                  borderRadius: 8,
                  border: '1px solid var(--brand-100)',
                }}
              >
                <option value="Laag">Laag</option>
                <option value="Matig">Matig</option>
                <option value="Ernstig">Ernstig</option>
                <option value="Onaanvaardbaar">Onaanvaardbaar</option>
              </select>
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => patchIncident(activeIncident.id, { manager_risk_label: selectedLabel })}
                disabled={savingId === activeIncident.id}
                style={{
                  padding: '10px 12px',
                  fontSize: 16,
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--brand-900)',
                  color: 'white',
                  fontWeight: 700,
                }}
              >
                Opslaan
              </button>
              <button
                type="button"
                onClick={() => setModalIncidentId(null)}
                style={{ padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1px solid var(--brand-100)' }}
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
