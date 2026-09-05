import { cache } from 'react';
import type { createClient } from '@/utils/supabase/server';
import type { Tables } from '@/types_db';

type TypedSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type Product = Tables<'products'>;
type Price = Tables<'prices'>;
type Subscription = Tables<'subscriptions'>;
type UserDetails = Tables<'users'>;

interface ProductWithPrices extends Product {
  prices: Price[];
}

interface PriceWithProduct extends Price {
  products: Product | null;
}

interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

export const getUser = cache(async (supabase: TypedSupabaseClient) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
});

export const getSubscription = cache(async (supabase: TypedSupabaseClient) => {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();
  return subscription as SubscriptionWithProduct | null;
});

export const getProducts = cache(async (supabase: TypedSupabaseClient) => {
  const { data: products } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });
  return products as ProductWithPrices[] | null;
});

export const getUserDetails = cache(async (supabase: TypedSupabaseClient) => {
  const { data: userDetails } = await supabase
    .from('users')
    .select('*')
    .single();
  return userDetails as UserDetails | null;
});
