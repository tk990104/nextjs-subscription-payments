import type { Metadata } from 'next';
import Calculator from '@/components/gematria/Calculator';
import { PLAN_ENTITLEMENTS, planFromProductMetadata } from '@/lib/entitlements';
import { getUserCustomCiphers } from '@/lib/gematria/server';
import { DEFAULT_CIPHER_IDS } from '@/lib/gematria';
import { getSubscription, getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import type { UserPreferencesRow } from '@/types_gematria';

export const metadata: Metadata = {
  title: 'Calculator | Cipher Forge',
  description: 'Compare phrases across a clean-room English cipher catalog.'
};

export default async function CalculatorPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  const subscription = user ? await getSubscription(supabase) : null;
  const planId = planFromProductMetadata(
    subscription?.prices?.products?.metadata
  );
  const { data: history } = user
    ? await supabase
        .from('calculation_history')
        .select('id, phrase, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] };
  const customCiphers =
    user && PLAN_ENTITLEMENTS[planId].features.customCiphers
      ? await getUserCustomCiphers(supabase)
      : [];
  let initialCipherIds = [...DEFAULT_CIPHER_IDS];
  if (user && PLAN_ENTITLEMENTS[planId].features.savedPreferences) {
    const { data } = await supabase
      .from('user_preferences')
      .select('default_cipher_ids')
      .maybeSingle();
    const preferences = data as Pick<
      UserPreferencesRow,
      'default_cipher_ids'
    > | null;
    if (preferences) initialCipherIds = preferences.default_cipher_ids;
  }

  return (
    <Calculator
      isAuthenticated={Boolean(user)}
      plan={PLAN_ENTITLEMENTS[planId]}
      initialHistory={history ?? []}
      customCiphers={customCiphers}
      initialCipherIds={initialCipherIds}
    />
  );
}
