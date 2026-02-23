import { NextResponse } from 'next/server';

import { notifyManagers } from '@/lib/notifyManagers';
import { calculateIncidentRisk } from '@/lib/risk';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Incident } from '@/lib/types';

function validatePayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;

  const { reporter_name, location, description } = payload as Record<string, unknown>;
  if (typeof location !== 'string' || typeof description !== 'string') return null;
  if (typeof reporter_name !== 'undefined' && reporter_name !== null && typeof reporter_name !== 'string') return null;

  const cleanReporterName = typeof reporter_name === 'string' ? reporter_name.trim() : '';
  const cleanLocation = location.trim();
  const cleanDescription = description.trim();

  if (cleanReporterName.length > 120) return null;
  if (!cleanLocation || cleanLocation.length > 200) return null;
  if (!cleanDescription || cleanDescription.length > 4000) return null;

  return {
    reporter_name: cleanReporterName || null,
    location: cleanLocation,
    description: cleanDescription,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = validatePayload(body);

    if (!payload) {
      return NextResponse.json({ error: 'Ongeldige invoer' }, { status: 400 });
    }

    const risk = calculateIncidentRisk(payload);

    const { data, error } = await supabaseAdmin
      .from('incidents')
      .insert({
        reporter_name: payload.reporter_name,
        location: payload.location,
        description: payload.description,
        ai_risk_score: risk.score,
        ai_risk_label: risk.label,
        final_risk_label: risk.label,
        risk_source: 'AI',
      })
      .select('*')
      .single<Incident>();

    if (error || !data) {
      throw error || new Error('Insert failed');
    }

    await notifyManagers({
      incident: {
        id: data.id,
        location: data.location,
        description: data.description,
        final_risk_label: data.final_risk_label,
      },
      source: 'NEW_INCIDENT',
    });

    return NextResponse.json(
      {
        id: data.id,
        final_risk_label: data.final_risk_label,
        risk_source: data.risk_source,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/incidents/create failed', error);
    return NextResponse.json({ error: 'Kon incident niet aanmaken' }, { status: 500 });
  }
}
