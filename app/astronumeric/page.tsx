import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AstroNumericWorkspace from '@/components/gematria/AstroNumericWorkspace';
import { PLAN_ENTITLEMENTS, planFromProductMetadata } from '@/lib/entitlements';
import type { AstroEventRow } from '@/types_gematria';
import { getSubscription, getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'AstroNumeric Laboratory | Cipher Forge',
  description: 'Combine planetary event charts with gematria research.'
};

export default async function AstroNumericPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/signin');
  const subscription = await getSubscription(supabase);
  const planId = planFromProductMetadata(
    subscription?.prices?.products?.metadata
  );
  const plan = PLAN_ENTITLEMENTS[planId];
  const { data } = plan.features.astronomy
    ? await supabase
        .from('astro_events')
        .select('id, event_name, event_time, location_name, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] };
  const events = (data ?? []) as unknown as Pick<
    AstroEventRow,
    'id' | 'event_name' | 'event_time' | 'location_name' | 'created_at'
  >[];
  const initialDateTime = new Date().toISOString().slice(0, 16);

  return (
    <AstroNumericWorkspace
      plan={plan}
      initialEvents={events}
      initialDateTime={initialDateTime}
    />
  );
}
