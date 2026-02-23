'use client';

import { useMemo, useState } from 'react';

import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

type NotificationItem = {
  id: string;
  created_at: string;
  title: string | null;
  message: string | null;
  read: boolean;
};

export function NotificationsClient({ initialNotifications }: { initialNotifications: NotificationItem[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...notifications].sort((a, b) => {
        if (a.read !== b.read) return Number(a.read) - Number(b.read);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [notifications],
  );

  async function markAsRead(id: string) {
    setSavingId(id);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (updateError) throw updateError;

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section style={{ display: 'grid', gap: 12, fontSize: 18 }}>
      {error ? <p style={{ color: '#b91c1c', fontSize: 18 }}>{error}</p> : null}

      {sorted.length === 0 ? (
        <article style={{ background: 'var(--surface)', border: '1px solid var(--brand-100)', borderRadius: 12, padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Geen notificaties</h3>
          <p style={{ marginBottom: 0, color: 'var(--muted)' }}>Nieuwe meldingen verschijnen hier automatisch.</p>
        </article>
      ) : null}

      {sorted.map((item) => (
        <article
          key={item.id}
          style={{
            background: 'var(--surface)',
            borderRadius: 12,
            padding: 18,
            opacity: item.read ? 0.72 : 1,
            border: '1px solid var(--brand-100)',
            boxShadow: '0 6px 16px rgba(23, 62, 67, 0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 24, color: 'var(--brand-900)' }}>{item.title || 'Notificatie'}</h3>
            {!item.read ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#1d4ed8',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 999, background: '#2563eb', display: 'inline-block' }} />
                Ongelezen
              </span>
            ) : null}
          </div>
          <p style={{ fontSize: 18, marginTop: 0 }}>{item.message || 'Geen bericht'}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, color: '#334155' }}>{new Date(item.created_at).toLocaleString('nl-NL')}</span>
            {!item.read ? (
              <button
                type="button"
                onClick={() => markAsRead(item.id)}
                disabled={savingId === item.id}
                style={{
                  padding: '8px 10px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--brand-900)',
                  color: 'white',
                  fontWeight: 700,
                }}
              >
                Markeer als gelezen
              </button>
            ) : (
              <span style={{ display: 'block', fontSize: 14, color: '#334155' }}>Gelezen</span>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
