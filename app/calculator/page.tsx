import type { Metadata } from 'next';
import Calculator from '@/components/gematria/Calculator';
import { PLAN_ENTITLEMENTS, planFromProductMetadata } from '@/lib/entitlements';
import { getSubscription, getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'Calculator | Gematria Research Platform',
  description: 'Compare phrases across foundational English gematria ciphers.'
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

  return (
    <Calculator
      isAuthenticated={Boolean(user)}
      plan={PLAN_ENTITLEMENTS[planId]}
      initialHistory={history ?? []}
    />
  );
}
