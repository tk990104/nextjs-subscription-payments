import { describe, expect, it } from 'vitest';
import {
  isWithinLimit,
  PLAN_ENTITLEMENTS,
  planFromProductMetadata
} from './entitlements';

describe('subscription entitlements', () => {
  it('defaults unknown Stripe metadata to the free plan', () => {
    expect(planFromProductMetadata(undefined)).toBe('free');
    expect(planFromProductMetadata({ gematria_plan: 'unknown' })).toBe('free');
  });

  it('resolves a supported plan from Stripe product metadata', () => {
    expect(planFromProductMetadata({ gematria_plan: 'astronumeric' })).toBe(
      'astronumeric'
    );
    expect(PLAN_ENTITLEMENTS.astronumeric.features.astronomy).toBe(true);
    expect(PLAN_ENTITLEMENTS.astronumeric.limits.astroEvents).toBe(1000);
  });

  it('treats a null quota as unlimited', () => {
    expect(isWithinLimit(1000000, null)).toBe(true);
    expect(isWithinLimit(9, 10)).toBe(true);
    expect(isWithinLimit(10, 10)).toBe(false);
  });

  it('gates research publishing and export to paid plans', () => {
    expect(PLAN_ENTITLEMENTS.free.features.researchExport).toBe(false);
    expect(PLAN_ENTITLEMENTS.free.features.shareReports).toBe(false);
    expect(PLAN_ENTITLEMENTS.researcher.features.researchExport).toBe(true);
    expect(PLAN_ENTITLEMENTS.researcher.features.shareReports).toBe(true);
  });
});
