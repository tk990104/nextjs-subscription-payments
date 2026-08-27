import * as Astronomy from '../../vendor/astronomy-engine.js';

const BODY_ENTRIES = [
  ['Sun', Astronomy.Body.Sun],
  ['Moon', Astronomy.Body.Moon],
  ['Mercury', Astronomy.Body.Mercury],
  ['Venus', Astronomy.Body.Venus],
  ['Mars', Astronomy.Body.Mars],
  ['Jupiter', Astronomy.Body.Jupiter],
  ['Saturn', Astronomy.Body.Saturn],
  ['Uranus', Astronomy.Body.Uranus],
  ['Neptune', Astronomy.Body.Neptune],
  ['Pluto', Astronomy.Body.Pluto]
] as const;

const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces'
] as const;

const ASPECTS = [
  ['Conjunction', 0],
  ['Sextile', 60],
  ['Square', 90],
  ['Trine', 120],
  ['Opposition', 180]
] as const;

export interface AstronomyInput {
  eventName: string;
  dateTime: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
}

export interface PlanetPosition {
  body: string;
  longitude: number;
  latitude: number;
  sign: (typeof SIGNS)[number];
  degree: number;
  retrograde: boolean;
  altitude: number;
  azimuth: number;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function signedDifference(later: number, earlier: number) {
  let difference = normalizeDegrees(later) - normalizeDegrees(earlier);
  if (difference > 180) difference -= 360;
  if (difference < -180) difference += 360;
  return difference;
}

function eclipticPosition(body: Astronomy.Body, date: Date) {
  if (body === Astronomy.Body.Sun) {
    const position = Astronomy.SunPosition(date);
    return { longitude: position.elon, latitude: position.elat };
  }
  if (body === Astronomy.Body.Moon) {
    const position = Astronomy.EclipticGeoMoon(date);
    return { longitude: position.lon, latitude: position.lat };
  }
  const vector = Astronomy.GeoVector(body, date, true);
  const rotated = Astronomy.RotateVector(
    Astronomy.Rotation_EQJ_ECT(date),
    vector
  );
  const position = Astronomy.SphereFromVector(rotated);
  return { longitude: position.lon, latitude: position.lat };
}

function rounded(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

export function calculateEventChart(input: AstronomyInput) {
  const date = new Date(input.dateTime);
  const observer = new Astronomy.Observer(input.latitude, input.longitude, 0);
  const positions: PlanetPosition[] = BODY_ENTRIES.map(([name, body]) => {
    const position = eclipticPosition(body, date);
    const before = eclipticPosition(
      body,
      new Date(date.getTime() - 6 * 60 * 60 * 1000)
    );
    const after = eclipticPosition(
      body,
      new Date(date.getTime() + 6 * 60 * 60 * 1000)
    );
    const equatorial = Astronomy.Equator(body, date, observer, true, true);
    const horizon = Astronomy.Horizon(
      date,
      observer,
      equatorial.ra,
      equatorial.dec,
      'normal'
    );
    const longitude = normalizeDegrees(position.longitude);
    const signIndex = Math.floor(longitude / 30);
    return {
      body: name,
      longitude: rounded(longitude),
      latitude: rounded(position.latitude),
      sign: SIGNS[signIndex],
      degree: rounded(longitude % 30, 2),
      retrograde: signedDifference(after.longitude, before.longitude) < 0,
      altitude: rounded(horizon.altitude, 2),
      azimuth: rounded(horizon.azimuth, 2)
    };
  });

  const aspects = positions.flatMap((first, firstIndex) =>
    positions.slice(firstIndex + 1).flatMap((second) => {
      const raw = Math.abs(first.longitude - second.longitude);
      const separation = Math.min(raw, 360 - raw);
      const match = ASPECTS.map(([name, angle]) => ({
        name,
        angle,
        orb: Math.abs(separation - angle)
      })).sort((a, b) => a.orb - b.orb)[0];
      return match.orb <= 3
        ? [
            {
              first: first.body,
              second: second.body,
              aspect: match.name,
              separation: rounded(separation, 2),
              orb: rounded(match.orb, 2)
            }
          ]
        : [];
    })
  );
  const moonPhaseAngle = normalizeDegrees(Astronomy.MoonPhase(date));
  const phaseNames = [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Third Quarter',
    'Waning Crescent'
  ];
  const phaseIndex = Math.floor((moonPhaseAngle + 22.5) / 45) % 8;

  return {
    eventName: input.eventName,
    dateTime: date.toISOString(),
    latitude: input.latitude,
    longitude: input.longitude,
    locationName: input.locationName,
    moonPhase: {
      name: phaseNames[phaseIndex],
      angle: rounded(moonPhaseAngle, 2),
      illuminatedFraction: rounded(
        (1 - Math.cos((moonPhaseAngle * Math.PI) / 180)) / 2,
        3
      )
    },
    positions,
    aspects
  };
}
