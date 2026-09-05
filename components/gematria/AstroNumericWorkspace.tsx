'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import type { PlanEntitlements } from '@/lib/entitlements';

interface Position {
  body: string;
  sign: string;
  degree: number;
  longitude: number;
  latitude: number;
  retrograde: boolean;
  altitude: number;
  azimuth: number;
}

interface Aspect {
  first: string;
  second: string;
  aspect: string;
  separation: number;
  orb: number;
}

interface Chart {
  eventName: string;
  dateTime: string;
  locationName: string | null;
  moonPhase: { name: string; angle: number; illuminatedFraction: number };
  positions: Position[];
  aspects: Aspect[];
}

interface GematriaResult {
  cipherId: string;
  cipherName: string;
  total: number;
}

export interface AstroEventSummary {
  id: string;
  event_name: string;
  event_time: string;
  location_name: string | null;
  created_at: string;
}

interface Props {
  plan: PlanEntitlements;
  initialEvents: AstroEventSummary[];
  initialDateTime: string;
}

export default function AstroNumericWorkspace({
  plan,
  initialEvents,
  initialDateTime
}: Props) {
  const [chart, setChart] = useState<Chart | null>(null);
  const [gematria, setGematria] = useState<GematriaResult[]>([]);
  const [events, setEvents] = useState(initialEvents);
  const dateTimeRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{
    loading?: boolean;
    message?: string;
    error?: boolean;
  }>({});

  useEffect(() => {
    const now = new Date();
    if (dateTimeRef.current) {
      dateTimeRef.current.value = new Date(
        now.getTime() - now.getTimezoneOffset() * 60_000
      )
        .toISOString()
        .slice(0, 16);
    }
  }, []);

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const save = submitter?.value === 'save';
    const localDate = new Date(String(form.get('dateTime')));
    setStatus({
      loading: true,
      message: save ? 'Calculating and saving…' : 'Calculating chart…'
    });
    try {
      const response = await fetch('/api/gematria/astronomy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventName: form.get('eventName'),
          dateTime: localDate.toISOString(),
          locationName: form.get('locationName'),
          latitude: Number(form.get('latitude')),
          longitude: Number(form.get('longitude')),
          save
        })
      });
      const body = (await response.json()) as {
        error?: string;
        chart?: Chart;
        gematriaResults?: GematriaResult[];
        saved?: AstroEventSummary | null;
      };
      if (!response.ok) throw new Error(body.error ?? 'Calculation failed.');
      setChart(body.chart ?? null);
      setGematria(body.gematriaResults ?? []);
      if (body.saved) {
        setEvents((current) => [body.saved!, ...current].slice(0, 20));
      }
      setStatus({
        message: body.saved
          ? 'Event chart calculated and saved.'
          : 'Event chart calculated.'
      });
    } catch (error) {
      setStatus({
        error: true,
        message: error instanceof Error ? error.message : 'Calculation failed.'
      });
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="max-w-3xl">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
            AstroNumeric laboratory
          </p>
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
            {plan.label} plan
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Combine event charts with gematria
        </h1>
        <p className="mt-4 text-lg text-zinc-300">
          Calculate tropical planetary positions, lunar phase, major aspects,
          observer coordinates, and the event name’s foundational values.
        </p>
      </div>

      {!plan.features.astronomy ? (
        <div className="mt-8 rounded-2xl border border-amber-700/60 bg-amber-950/30 p-6">
          <h2 className="text-xl font-bold text-amber-200">
            AstroNumeric plan required
          </h2>
          <p className="mt-2 max-w-2xl text-amber-100/80">
            Planetary event charts and saved AstroNumeric events are reserved
            for the AstroNumeric subscription.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-pink-500 px-5 py-3 font-semibold"
          >
            View plans
          </Link>
        </div>
      ) : (
        <>
          <form
            onSubmit={calculate}
            className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium">
                Event name
                <input
                  name="eventName"
                  required
                  maxLength={120}
                  defaultValue="Championship Event"
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
                />
              </label>
              <label className="text-sm font-medium">
                Local event date and time
                <input
                  name="dateTime"
                  ref={dateTimeRef}
                  type="datetime-local"
                  required
                  defaultValue={initialDateTime}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
                />
              </label>
              <label className="text-sm font-medium">
                Location name
                <input
                  name="locationName"
                  maxLength={120}
                  defaultValue="Atlanta, Georgia"
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Latitude
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    required
                    defaultValue="33.749"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
                  />
                </label>
                <label className="text-sm font-medium">
                  Longitude
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    required
                    defaultValue="-84.388"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
                  />
                </label>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Date and time are interpreted in your browser’s local timezone.
              Latitude is north-positive; longitude is east-positive.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                value="calculate"
                disabled={status.loading}
                className="rounded-lg border border-pink-500 px-5 py-3 font-semibold text-pink-300 hover:bg-pink-500/10 disabled:opacity-50"
              >
                Calculate
              </button>
              <button
                type="submit"
                value="save"
                disabled={status.loading}
                className="rounded-lg bg-pink-500 px-5 py-3 font-semibold hover:bg-pink-400 disabled:opacity-50"
              >
                Calculate and save
              </button>
              {status.message && (
                <p
                  role="status"
                  className={`self-center ${status.error ? 'text-red-300' : 'text-emerald-300'}`}
                >
                  {status.message}
                </p>
              )}
            </div>
          </form>

          {chart && (
            <div className="mt-8 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {gematria.map((result) => (
                  <div
                    key={result.cipherId}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <p className="text-xs text-zinc-500">{result.cipherName}</p>
                    <p className="mt-1 text-3xl font-bold text-pink-400">
                      {result.total}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold">{chart.eventName}</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      {new Date(chart.dateTime).toLocaleString()} ·{' '}
                      {chart.locationName || 'Unnamed location'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-pink-300">
                      {chart.moonPhase.name}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {Math.round(chart.moonPhase.illuminatedFraction * 100)}%
                      illuminated
                    </p>
                  </div>
                </div>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-zinc-500">
                      <tr>
                        <th className="pb-3">Body</th>
                        <th className="pb-3">Tropical position</th>
                        <th className="pb-3">Motion</th>
                        <th className="pb-3">Altitude</th>
                        <th className="pb-3">Azimuth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {chart.positions.map((position) => (
                        <tr key={position.body}>
                          <td className="py-3 font-medium">{position.body}</td>
                          <td className="py-3 text-zinc-300">
                            {position.degree.toFixed(2)}° {position.sign}
                          </td>
                          <td className="py-3 text-zinc-400">
                            {position.retrograde ? 'Retrograde' : 'Direct'}
                          </td>
                          <td className="py-3 text-zinc-400">
                            {position.altitude.toFixed(2)}°
                          </td>
                          <td className="py-3 text-zinc-400">
                            {position.azimuth.toFixed(2)}°
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <h2 className="text-2xl font-bold">Major aspects</h2>
                {chart.aspects.length ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {chart.aspects.map((aspect) => (
                      <p
                        key={`${aspect.first}-${aspect.second}`}
                        className="rounded-lg border border-zinc-800 p-3 text-sm"
                      >
                        {aspect.first} {aspect.aspect} {aspect.second}{' '}
                        <span className="text-zinc-500">
                          ({aspect.orb.toFixed(2)}° orb)
                        </span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-zinc-500">
                    No major aspects within a 3° orb.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {plan.features.astronomy && (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-2xl font-bold">Saved AstroNumeric events</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {events.length} shown · {plan.limits.astroEvents.toLocaleString()}{' '}
            maximum
          </p>
          {events.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="pb-3">Event</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Event time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {events.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-medium">{item.event_name}</td>
                      <td className="py-3 text-zinc-400">
                        {item.location_name || '—'}
                      </td>
                      <td className="py-3 text-zinc-400">
                        {new Date(item.event_time).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-zinc-500">No saved event charts yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
