import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { StatisticsClient } from './StatisticsClient';
import type { Incident } from '@/lib/types';

export default async function ManagerStatisticsPage() {
  const supabase = await createSupabaseServerClient();
  const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('*')
    .gte('created_at', fromDate)
    .order('created_at', { ascending: true })
    .returns<Incident[]>();

  if (error) {
    throw new Error(`Kon statistieken niet laden: ${error.message}`);
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
        <img src="/dudok_logo.svg" alt="Dudok logo" style={{ width: 128, height: 'auto', display: 'block' }} />
      </div>
      <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', margin: '8px 0 20px', color: '#000000' }}>Statistieken</h1>
      <StatisticsClient incidents={incidents || []} />
    </section>
  );
}
