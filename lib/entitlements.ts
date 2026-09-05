export type PlanId = 'free' | 'researcher' | 'pro' | 'astronumeric';

export type FeatureKey =
  | 'databaseMatch'
  | 'customCiphers'
  | 'customTables'
  | 'savedPreferences'
  | 'researchExport'
  | 'shareReports'
  | 'imageExport'
  | 'bibleSearch'
  | 'advancedDates'
  | 'astronomy';

export interface PlanEntitlements {
  id: PlanId;
  label: string;
  limits: {
    databaseMatchesPerDay: number | null;
    historyEntries: number;
    customCiphers: number;
    customTables: number;
    astroEvents: number;
  };
  features: Readonly<Record<FeatureKey, boolean>>;
}

export const PLAN_ENTITLEMENTS: Readonly<Record<PlanId, PlanEntitlements>> =
  Object.freeze({
    free: {
      id: 'free',
      label: 'Free',
      limits: {
        databaseMatchesPerDay: 10,
        historyEntries: 50,
        customCiphers: 0,
        customTables: 0,
        astroEvents: 0
      },
      features: {
        databaseMatch: true,
        customCiphers: false,
        customTables: false,
        savedPreferences: false,
        researchExport: false,
        shareReports: false,
        imageExport: false,
        bibleSearch: false,
        advancedDates: false,
        astronomy: false
      }
    },
    researcher: {
      id: 'researcher',
      label: 'Researcher',
      limits: {
        databaseMatchesPerDay: 100,
        historyEntries: 1000,
        customCiphers: 8,
        customTables: 4,
        astroEvents: 0
      },
      features: {
        databaseMatch: true,
        customCiphers: true,
        customTables: true,
        savedPreferences: true,
        researchExport: true,
        shareReports: true,
        imageExport: true,
        bibleSearch: false,
        advancedDates: true,
        astronomy: false
      }
    },
    pro: {
      id: 'pro',
      label: 'Pro',
      limits: {
        databaseMatchesPerDay: null,
        historyEntries: 5000,
        customCiphers: 50,
        customTables: 20,
        astroEvents: 0
      },
      features: {
        databaseMatch: true,
        customCiphers: true,
        customTables: true,
        savedPreferences: true,
        researchExport: true,
        shareReports: true,
        imageExport: true,
        bibleSearch: true,
        advancedDates: true,
        astronomy: false
      }
    },
    astronumeric: {
      id: 'astronumeric',
      label: 'AstroNumeric',
      limits: {
        databaseMatchesPerDay: null,
        historyEntries: 10000,
        customCiphers: 100,
        customTables: 50,
        astroEvents: 1000
      },
      features: {
        databaseMatch: true,
        customCiphers: true,
        customTables: true,
        savedPreferences: true,
        researchExport: true,
        shareReports: true,
        imageExport: true,
        bibleSearch: true,
        advancedDates: true,
        astronomy: true
      }
    }
  });

export function planFromProductMetadata(metadata: unknown): PlanId {
  if (!metadata || typeof metadata !== 'object') return 'free';
  const candidate = (metadata as Record<string, unknown>).gematria_plan;
  return typeof candidate === 'string' && candidate in PLAN_ENTITLEMENTS
    ? (candidate as PlanId)
    : 'free';
}

export function isWithinLimit(current: number, limit: number | null) {
  return limit === null || current < limit;
}
