import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import CorpusAdmin from '@/components/gematria/CorpusAdmin';
import { isGematriaAdmin } from '@/lib/gematria/server';
import { getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'Corpus Administration | Gematria Research Platform'
};

export default async function CorpusAdminPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/signin');
  if (!isGematriaAdmin(user.id)) notFound();
  return <CorpusAdmin />;
}
