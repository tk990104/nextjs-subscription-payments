import Stripe from 'stripe';

const stripeKey =
  process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? '';

export const stripe = stripeKey
  ? new Stripe(stripeKey, {
      // Register this as an official Stripe plugin.
      // https://stripe.com/docs/building-plugins#setappinfo
      appInfo: {
        name: 'Gematria Research Platform',
        version: '0.1.0',
        url: 'https://github.com/tk990104/nextjs-subscription-payments'
      }
    })
  : null;
