'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

export default function ManagerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;
      if (!data.user) throw new Error('Geen gebruiker gevonden.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single<{ role: 'manager' | 'employee' }>();

      if (profileError || profile?.role !== 'manager') {
        await supabase.auth.signOut();
        throw new Error('Dit account heeft geen managerrechten.');
      }

      router.push(searchParams.get('next') || '/manager/incidents');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: '28px auto', padding: '0 clamp(16px, 4vw, 24px)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
        <img src="/dudok_logo.svg" alt="Dudok logo" style={{ width: 128, height: 'auto', display: 'block' }} />
      </div>
      <section
        style={{
          maxWidth: 520,
          padding: 24,
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--brand-100)',
          boxShadow: '0 8px 24px rgba(23, 62, 67, 0.06)',
        }}
      >
        <h1 style={{ marginTop: 0, color: '#000000' }}>Manager login</h1>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ fontSize: 17, fontWeight: 600 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              marginTop: 6,
              borderRadius: 8,
              border: '1px solid var(--brand-100)',
              background: '#fbfdfd',
              fontSize: 16,
            }}
          />
        </label>
        <label style={{ fontSize: 17, fontWeight: 600 }}>
          Wachtwoord
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              marginTop: 6,
              borderRadius: 8,
              border: '1px solid var(--brand-100)',
              background: '#fbfdfd',
              fontSize: 16,
            }}
          />
        </label>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--brand-900)',
              color: 'white',
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            {loading ? 'Inloggen...' : 'Inloggen'}
          </button>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
