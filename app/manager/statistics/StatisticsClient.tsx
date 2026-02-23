'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { Incident } from '@/lib/types';

type FilterDays = 7 | 30 | 90;
type StatusFilter = 'all' | 'open' | 'in_behandeling' | 'opgelost';

const RISK_COLORS: Record<string, string> = {
  Laag: '#15803d',
  Matig: '#a16207',
  Ernstig: '#b91c1c',
  Onaanvaardbaar: '#7f1d1d',
  Onbekend: '#64748b',
};

function statusLabel(status: StatusFilter) {
  if (status === 'all') return 'Alle';
  if (status === 'open') return 'Open';
  if (status === 'in_behandeling') return 'In behandeling';
  return 'Afgehandeld';
}

function formatDay(dateString: string) {
  return new Date(dateString).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' });
}

function truncateLabel(value: string, max = 12) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export function StatisticsClient({ incidents }: { incidents: Incident[] }) {
  const [days, setDays] = useState<FilterDays>(30);
  const [location, setLocation] = useState<string>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [isPending, startTransition] = useTransition();

  const locations = useMemo(() => {
    const set = new Set<string>();
    incidents.forEach((incident) => {
      if (incident.location) set.add(incident.location);
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'nl-NL'))];
  }, [incidents]);

  const filtered = useMemo(() => {
    const from = Date.now() - days * 24 * 60 * 60 * 1000;

    return incidents.filter((incident) => {
      const createdTime = new Date(incident.created_at).getTime();
      if (createdTime < from) return false;
      if (location !== 'all' && incident.location !== location) return false;
      if (status !== 'all' && incident.status !== status) return false;
      return true;
    });
  }, [incidents, days, location, status]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const severe = filtered.filter(
      (incident) => incident.final_risk_label === 'Ernstig' || incident.final_risk_label === 'Onaanvaardbaar',
    ).length;

    const open = filtered.filter((incident) => incident.status === 'open' || incident.status === 'in_behandeling').length;
    const handled = filtered.filter((incident) => incident.status === 'opgelost').length;

    const locationCount = filtered.reduce<Record<string, number>>((acc, incident) => {
      acc[incident.location] = (acc[incident.location] || 0) + 1;
      return acc;
    }, {});

    const topLocation =
      Object.entries(locationCount)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)[0] || '—';

    return { total, severe, open, handled, topLocation };
  }, [filtered]);

  const pieData = useMemo(() => {
    const counts = filtered.reduce<Record<string, number>>((acc, incident) => {
      const label = incident.final_risk_label || 'Onbekend';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const locationData = useMemo(() => {
    const counts = filtered.reduce<Record<string, number>>((acc, incident) => {
      acc[incident.location] = (acc[incident.location] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([locationName, count]) => ({ location: locationName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filtered]);

  const lineData = useMemo(() => {
    const counts = filtered.reduce<Record<string, number>>((acc, incident) => {
      const day = new Date(incident.created_at).toISOString().slice(0, 10);
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const rows = Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, count]) => ({ day: formatDay(day), count }));

    return rows;
  }, [filtered]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          padding: 16,
          background: 'var(--surface)',
          border: '1px solid var(--brand-100)',
          borderRadius: 12,
        }}
      >
        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Periode
          <select
            value={days}
            onChange={(e) => startTransition(() => setDays(Number(e.target.value) as FilterDays))}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--brand-100)', minWidth: 140 }}
          >
            <option value={7}>Laatste 7 dagen</option>
            <option value={30}>Laatste 30 dagen</option>
            <option value={90}>Laatste 90 dagen</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Locatie
          <select
            value={location}
            onChange={(e) => startTransition(() => setLocation(e.target.value))}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--brand-100)', minWidth: 180 }}
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc === 'all' ? 'Alle locaties' : loc}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Status
          <select
            value={status}
            onChange={(e) => startTransition(() => setStatus(e.target.value as StatusFilter))}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--brand-100)', minWidth: 180 }}
          >
            <option value="all">Alle statussen</option>
            <option value="open">Open</option>
            <option value="in_behandeling">In behandeling</option>
            <option value="opgelost">Afgehandeld</option>
          </select>
        </label>

        {isPending ? <p style={{ margin: 0, alignSelf: 'end', color: 'var(--muted)' }}>Laden...</p> : null}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <article
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--brand-100)',
            borderTop: '4px solid var(--brand-700)',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <p style={{ margin: 0, color: 'var(--muted)' }}>Totaal incidenten ({days}d)</p>
          <h3 style={{ margin: '8px 0 0', fontSize: 34, lineHeight: 1.1 }}>{kpis.total}</h3>
        </article>
        <article
          style={{
            background: 'var(--surface)',
            border: '1px solid #fecaca',
            borderTop: '4px solid #dc2626',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <p style={{ margin: 0, color: '#991b1b' }}>Ernstig/Onaanvaardbaar</p>
          <h3 style={{ margin: '8px 0 0', fontSize: 34, lineHeight: 1.1, color: '#b91c1c' }}>{kpis.severe}</h3>
        </article>
        <article
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--brand-100)',
            borderTop: '4px solid #0f766e',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <p style={{ margin: 0, color: 'var(--muted)' }}>Open vs Afgehandeld</p>
          <h3 style={{ margin: '8px 0 0', fontSize: 34, lineHeight: 1.1 }}>
            {kpis.open} / {kpis.handled}
          </h3>
        </article>
        <article
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--brand-100)',
            borderTop: '4px solid #0e7490',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <p style={{ margin: 0, color: 'var(--muted)' }}>Meest voorkomende locatie</p>
          <h3 style={{ margin: '8px 0 0', fontSize: 28, lineHeight: 1.2 }}>{kpis.topLocation}</h3>
        </article>
      </section>

      {filtered.length === 0 ? (
        <section style={{ background: 'var(--surface)', border: '1px solid var(--brand-100)', borderRadius: 12, padding: 20 }}>
          <p style={{ margin: 0 }}>Nog geen incidenten in deze periode.</p>
        </section>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
          <article
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--brand-100)',
              borderRadius: 12,
              padding: 16,
              minHeight: 320,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Verdeling risiconiveau</h3>
            <ResponsiveContainer width="100%" height={235}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={48} outerRadius={80}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || RISK_COLORS.Onbekend} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </article>

          <article
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--brand-100)',
              borderRadius: 12,
              padding: 16,
              minHeight: 320,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Incidenten per locatie (top 10)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={locationData} margin={{ top: 8, right: 6, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" tickFormatter={(value) => truncateLabel(String(value), 10)} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value}`, 'Aantal']}
                  labelFormatter={(label) => `Locatie: ${label}`}
                />
                <Bar dataKey="count" fill="var(--brand-700)" />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article style={{ background: 'var(--surface)', border: '1px solid var(--brand-100)', borderRadius: 12, padding: 16, minHeight: 320, gridColumn: '1 / -1' }}>
            <h3 style={{ marginTop: 0 }}>Incidenten per dag</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--brand-900)" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </article>
        </section>
      )}

      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>Statusfilter: {statusLabel(status)}</p>
    </div>
  );
}
