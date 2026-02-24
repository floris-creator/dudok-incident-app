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
    <header className="manager-nav">
      <nav className="manager-nav-links">
        <Link
          href="/manager/incidents"
          className={pathname.startsWith('/manager/incidents') ? 'manager-nav-link manager-nav-link-active' : 'manager-nav-link'}
        >
          Incidenten
        </Link>
        <Link
          href="/manager/notifications"
          className={
            pathname.startsWith('/manager/notifications') ? 'manager-nav-link manager-nav-link-active' : 'manager-nav-link'
          }
        >
          Notificaties
        </Link>
        <Link
          href="/manager/statistics"
          className={pathname.startsWith('/manager/statistics') ? 'manager-nav-link manager-nav-link-active' : 'manager-nav-link'}
        >
          Statistieken
        </Link>
      </nav>
      <div className="manager-nav-actions">
        <button type="button" onClick={onLogout} className="manager-logout-button">
          Uitloggen
        </button>
      </div>
    </header>
  );
}
