import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { PLAN_ENTITLEMENTS, planFromProductMetadata } from '@/lib/entitlements';
import { BUILT_IN_CIPHERS } from '@/lib/gematria/ciphers';
import { customCipherFromStored } from '@/lib/gematria/custom';
import { getSubscription, getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import type { CustomCipherRow, GematriaDatabase } from '@/types_gematria';
import type { Json } from '@/types_db';

export async function getGematriaSession() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) return null;

  const subscription = await getSubscription(supabase);
  const planId = planFromProductMetadata(
    subscription?.prices?.products?.metadata
  );

  return {
    supabase,
    user,
    plan: PLAN_ENTITLEMENTS[planId]
  };
}

export function createGematriaAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server credentials are not configured.');
  }
  return createSupabaseAdmin<GematriaDatabase>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

type GematriaServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getUserCustomCiphers(supabase: GematriaServerClient) {
  const { data, error } = await supabase
    .from('custom_ciphers')
    .select('*')
    .eq('is_enabled', true)
    .order('created_at');
  if (error) throw error;

  const rows = (data ?? []) as unknown as CustomCipherRow[];
  return rows.flatMap((row) => {
    try {
      return [customCipherFromStored(row)];
    } catch (error) {
      console.error(`Skipping invalid custom cipher ${row.id}.`, error);
      return [];
    }
  });
}

export async function getUserCalculationCiphers(
  supabase: GematriaServerClient,
  includeCustomCiphers: boolean
) {
  return includeCustomCiphers
    ? [...BUILT_IN_CIPHERS, ...(await getUserCustomCiphers(supabase))]
    : [...BUILT_IN_CIPHERS];
}
