import { redirect } from 'next/navigation';

import { IncidentsClient } from './IncidentsClient';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { Incident } from '@/lib/types';

export default async function ManagerIncidentsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/manager/login');
  }

  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Incident[]>();

  if (error) {
    throw new Error(`Kon incidenten niet laden: ${error.message}`);
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
        <img src="/dudok_logo.svg" alt="Dudok logo" style={{ width: 128, height: 'auto', display: 'block' }} />
      </div>
      <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', margin: '8px 0 20px', color: '#000000' }}>Incidenten</h1>
      <IncidentsClient initialIncidents={incidents || []} />
    </section>
  );
}
