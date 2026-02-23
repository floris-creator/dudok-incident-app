import { redirect } from 'next/navigation';

import { NotificationsClient } from './NotificationsClient';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

type NotificationItem = {
  id: string;
  created_at: string;
  title: string | null;
  message: string | null;
  read: boolean;
};

export default async function ManagerNotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/manager/login');
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, created_at, title, message, read')
    .order('read', { ascending: true })
    .order('created_at', { ascending: false })
    .returns<NotificationItem[]>();

  if (error) {
    throw new Error(`Kon notificaties niet laden: ${error.message}`);
  }

  const unreadCount = (data || []).filter((item) => !item.read).length;

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
        <img src="/dudok_logo.svg" alt="Dudok logo" style={{ width: 128, height: 'auto', display: 'block' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', margin: '8px 0 20px', color: '#000000' }}>Notificaties</h1>
        <span
          style={{
            marginBottom: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 999,
            background: unreadCount > 0 ? '#eff6ff' : '#f1f5f9',
            color: unreadCount > 0 ? '#1d4ed8' : '#475569',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {unreadCount} ongelezen
        </span>
      </div>
      <NotificationsClient initialNotifications={data || []} />
    </section>
  );
}
