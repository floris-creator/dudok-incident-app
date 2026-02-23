'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

export function ManagerNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/manager/login' || pathname === '/manager/forbidden') {
    return null;
  }

  async function onLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/manager/login');
    router.refresh();
  }

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--brand-900)',
        color: 'white',
        padding: '14px 22px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
      }}
    >
      <nav style={{ display: 'flex', gap: 16 }}>
        <Link href="/manager/incidents" style={{ color: 'white', fontSize: 18, fontWeight: 600, textDecoration: 'none' }}>
          Incidenten
        </Link>
        <Link href="/manager/notifications" style={{ color: 'white', fontSize: 18, fontWeight: 600, textDecoration: 'none' }}>
          Notificaties
        </Link>
        <Link href="/manager/statistics" style={{ color: 'white', fontSize: 18, fontWeight: 600, textDecoration: 'none' }}>
          Statistieken
        </Link>
      </nav>
      <button
        type="button"
        onClick={onLogout}
        style={{
          padding: '10px 14px',
          fontSize: 16,
          borderRadius: 8,
          background: 'white',
          color: 'var(--brand-900)',
          border: '1px solid var(--brand-100)',
          fontWeight: 700,
        }}
      >
        Uitloggen
      </button>
    </header>
  );
}
