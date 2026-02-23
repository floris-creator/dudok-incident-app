import { NextResponse } from 'next/server';

import { notifyManagers } from '@/lib/notifyManagers';
import { riskRank } from '@/lib/risk';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { IncidentStatus, RiskLabel } from '@/lib/types';

const VALID_STATUS: IncidentStatus[] = ['open', 'in_behandeling', 'opgelost'];
const VALID_LABELS: RiskLabel[] = ['Laag', 'Matig', 'Ernstig', 'Onaanvaardbaar'];

function validatePayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;

  const { id, status, manager_risk_label } = payload as Record<string, unknown>;
  if (typeof id !== 'string' || !id) return null;

  const result: {
    id: string;
    status?: IncidentStatus;
    manager_risk_label?: RiskLabel;
  } = { id };

  if (typeof status !== 'undefined') {
    if (typeof status !== 'string' || !VALID_STATUS.includes(status as IncidentStatus)) return null;
    result.status = status as IncidentStatus;
  }

  if (typeof manager_risk_label !== 'undefined') {
    if (typeof manager_risk_label !== 'string' || !VALID_LABELS.includes(manager_risk_label as RiskLabel)) {
      return null;
    }
    result.manager_risk_label = manager_risk_label as RiskLabel;
  }

  if (!result.status && !result.manager_risk_label) return null;
  return result;
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: 'manager' | 'employee' }>();

    if (profileError || profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const payload = validatePayload(await req.json());
    if (!payload) {
      return NextResponse.json({ error: 'Ongeldige invoer' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('incidents')
      .select('id, location, description, final_risk_label')
      .eq('id', payload.id)
      .single<{
        id: string;
        location: string;
        description: string;
        final_risk_label: RiskLabel | null;
      }>();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Incident niet gevonden' }, { status: 404 });
    }

    const updates: Record<string, string> = {};

    if (payload.status) {
      updates.status = payload.status;
    }

    if (payload.manager_risk_label) {
      updates.manager_risk_label = payload.manager_risk_label;
      updates.final_risk_label = payload.manager_risk_label;
      updates.risk_source = 'MANAGER';
    }

    const { data: updated, error: updateError } = await supabase
      .from('incidents')
      .update(updates)
      .eq('id', payload.id)
      .select('id, location, description, status, final_risk_label, risk_source')
      .single<{
        id: string;
        location: string;
        description: string;
        status: IncidentStatus;
        final_risk_label: RiskLabel | null;
        risk_source: 'AI' | 'MANAGER';
      }>();

    if (updateError || !updated) {
      throw updateError || new Error('Update failed');
    }

    const oldRank = riskRank(existing.final_risk_label);
    const newRank = riskRank(updated.final_risk_label);
    const isHigh = updated.final_risk_label === 'Ernstig' || updated.final_risk_label === 'Onaanvaardbaar';
    const shouldNotify = Boolean(payload.manager_risk_label) && (isHigh || newRank > oldRank);

    if (shouldNotify) {
      await notifyManagers({
        incident: {
          id: updated.id,
          location: updated.location,
          description: updated.description,
          final_risk_label: updated.final_risk_label,
        },
        source: 'ESCALATION',
      });
    }

    return NextResponse.json({ incident: updated }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/incidents/update failed', error);
    return NextResponse.json({ error: 'Kon incident niet bijwerken' }, { status: 500 });
  }
}
