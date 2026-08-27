import { NextResponse } from 'next/server';
import { calculateEventChart } from '@/lib/astronomy/calculate';
import {
  AstronomyValidationError,
  parseAstronomyInput
} from '@/lib/astronomy/validation';
import { calculateWithCiphers, CORE_CIPHERS } from '@/lib/gematria';
import {
  createGematriaAdminClient,
  getGematriaSession,
  toJson
} from '@/lib/gematria/server';

export async function POST(request: Request) {
  try {
    const session = await getGematriaSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }
    if (!session.plan.features.astronomy) {
      return NextResponse.json(
        { error: 'Event charts require the AstroNumeric plan.' },
        { status: 403 }
      );
    }

    const input = parseAstronomyInput(await request.json());
    const chart = calculateEventChart(input);
    const gematriaResults = calculateWithCiphers(input.eventName, CORE_CIPHERS);
    let saved = null;

    if (input.save) {
      const admin = createGematriaAdminClient();
      const { data, error } = await admin.rpc('save_astro_event_with_limit', {
        p_user_id: session.user.id,
        p_event_name: input.eventName,
        p_event_time: input.dateTime,
        p_location_name: input.locationName,
        p_latitude: input.latitude,
        p_longitude: input.longitude,
        p_chart: toJson(chart),
        p_gematria_results: toJson(gematriaResults),
        p_limit: session.plan.limits.astroEvents
      });
      if (error) throw error;
      const row = data?.[0];
      if (!row?.allowed || !row.id || !row.created_at) {
        return NextResponse.json(
          {
            error: `Your ${session.plan.label} event limit has been reached.`,
            limit: session.plan.limits.astroEvents
          },
          { status: 409 }
        );
      }
      saved = {
        id: row.id,
        event_name: input.eventName,
        event_time: input.dateTime,
        location_name: input.locationName,
        created_at: row.created_at
      };
    }

    return NextResponse.json({ chart, gematriaResults, saved });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Malformed JSON body.' },
        { status: 400 }
      );
    }
    if (error instanceof AstronomyValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Unable to calculate astronomy chart.', error);
    return NextResponse.json(
      { error: 'Unable to calculate astronomy chart.' },
      { status: 500 }
    );
  }
}
