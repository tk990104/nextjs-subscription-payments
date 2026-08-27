import { describe, expect, it } from 'vitest';
import { calculateEventChart } from './calculate';
import { AstronomyValidationError, parseAstronomyInput } from './validation';

describe('AstroNumeric event chart', () => {
  it('calculates tropical planetary positions and observer coordinates', () => {
    const chart = calculateEventChart({
      eventName: 'March equinox fixture',
      dateTime: '2024-03-20T03:06:00.000Z',
      latitude: 33.749,
      longitude: -84.388,
      locationName: 'Atlanta'
    });
    expect(chart.positions).toHaveLength(10);
    const sun = chart.positions.find((position) => position.body === 'Sun');
    expect(['Pisces', 'Aries']).toContain(sun?.sign);
    expect(
      Math.min(sun?.longitude ?? 180, 360 - (sun?.longitude ?? 180))
    ).toBeLessThan(0.1);
    expect(chart.moonPhase.illuminatedFraction).toBeGreaterThanOrEqual(0);
    expect(chart.moonPhase.illuminatedFraction).toBeLessThanOrEqual(1);
  });

  it('validates event dates and coordinates', () => {
    expect(
      parseAstronomyInput({
        eventName: 'Kickoff',
        dateTime: '2026-09-01T00:00:00Z',
        latitude: 33.749,
        longitude: -84.388,
        save: true
      })
    ).toMatchObject({ eventName: 'Kickoff', save: true });
    expect(() =>
      parseAstronomyInput({
        eventName: 'Invalid',
        dateTime: '2026-01-01',
        latitude: 100,
        longitude: 0
      })
    ).toThrow(AstronomyValidationError);
  });
});
