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

  return (
    <section>
      <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', margin: '8px 0 20px', color: 'var(--brand-900)' }}>Notificaties</h1>
      <NotificationsClient initialNotifications={data || []} />
    </section>
  );
}
