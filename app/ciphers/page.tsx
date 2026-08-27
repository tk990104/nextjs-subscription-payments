import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CipherWorkspace from '@/components/gematria/CipherWorkspace';
import { PLAN_ENTITLEMENTS, planFromProductMetadata } from '@/lib/entitlements';
import type { CustomCipherRow } from '@/types_gematria';
import { getSubscription, getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'Cipher Studio | Gematria Research Platform',
  description: 'Create and preview custom English gematria ciphers.'
};

export default async function CiphersPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/signin');

  const [subscription, cipherResponse] = await Promise.all([
    getSubscription(supabase),
    supabase
      .from('custom_ciphers')
      .select('*')
      .order('created_at', { ascending: false })
  ]);
  const planId = planFromProductMetadata(
    subscription?.prices?.products?.metadata
  );

  return (
    <CipherWorkspace
      plan={PLAN_ENTITLEMENTS[planId]}
      initialCiphers={
        (cipherResponse.data ?? []) as unknown as CustomCipherRow[]
      }
    />
  );
}
