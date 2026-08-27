import type { AstronomyInput } from './calculate';

export class AstronomyValidationError extends Error {}

export function parseAstronomyInput(
  input: unknown
): AstronomyInput & { save: boolean } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AstronomyValidationError('A JSON object is required.');
  }
  const body = input as Record<string, unknown>;
  const eventName =
    typeof body.eventName === 'string' ? body.eventName.trim() : '';
  const locationName =
    typeof body.locationName === 'string'
      ? body.locationName.trim() || null
      : null;
  if (!eventName || eventName.length > 120) {
    throw new AstronomyValidationError('Event name must be 1–120 characters.');
  }
  if (locationName && locationName.length > 120) {
    throw new AstronomyValidationError(
      'Location name must be 120 characters or fewer.'
    );
  }
  if (typeof body.dateTime !== 'string') {
    throw new AstronomyValidationError('Event date and time are required.');
  }
  const date = new Date(body.dateTime);
  if (
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() < 1600 ||
    date.getUTCFullYear() > 2500
  ) {
    throw new AstronomyValidationError(
      'Event date must be between 1600 and 2500.'
    );
  }
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new AstronomyValidationError('Latitude must be between -90 and 90.');
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new AstronomyValidationError(
      'Longitude must be between -180 and 180.'
    );
  }
  return {
    eventName,
    dateTime: date.toISOString(),
    latitude,
    longitude,
    locationName,
    save: body.save === true
  };
}
