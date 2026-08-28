# Deployment checklist

For the complete preview sequence, use
[`docs/PREVIEW_DEPLOYMENT.md`](./PREVIEW_DEPLOYMENT.md).

## Required environment

| Variable                             | Visibility         | Purpose                                         |
| ------------------------------------ | ------------------ | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | Browser and server | Hosted Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Browser and server | RLS-constrained public API key                  |
| `SUPABASE_SERVICE_ROLE_KEY`          | Server only        | Entitlement-enforced database writes            |
| `GEMATRIA_ADMIN_USER_IDS`            | Server only        | Comma-separated corpus administrator user UUIDs |
| `STRIPE_SECRET_KEY`                  | Server only        | Stripe test-mode API access                     |
| `STRIPE_WEBHOOK_SECRET`              | Server only        | Webhook signature verification                  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser            | Stripe Checkout initialization                  |

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` through a
`NEXT_PUBLIC_` variable.

## Supabase

1. Link the repository to the intended Supabase project with
   `npm run supabase:link`.
2. Review the target project ID before applying changes.
3. Apply migrations in timestamp order with `npm run supabase:push`.
4. For a local reset, run `npm run supabase:reset`; Supabase will apply the
   migrations and then load `supabase/seed.sql`.
5. After a local reset has applied the current schema, generate authoritative
   local types with `npm run supabase:generate-types`.

The corpus seed is generated from `data/corpus.seed.json`. Change the JSON and
run `npm run corpus:build`; CI runs `npm run corpus:check` to prevent drift.
Authenticated users listed in `GEMATRIA_ADMIN_USER_IDS` can also import or
export CSV batches at `/admin/corpus`. Keep this allowlist server-only.

## Stripe test-mode fixtures

`npm run stripe:fixtures` creates the following provisional test-mode catalog.
Change the amounts before creating live-mode prices.

| Plan         | Monthly test price | Annual test price | Metadata                     |
| ------------ | -----------------: | ----------------: | ---------------------------- |
| Researcher   |                 $9 |               $90 | `gematria_plan=researcher`   |
| Pro          |                $19 |              $190 | `gematria_plan=pro`          |
| AstroNumeric |                $29 |              $290 | `gematria_plan=astronumeric` |

The Free plan has no Stripe product. Accounts without an active recognized
subscription resolve to Free.

## Safe release order

1. Configure Supabase environment variables in the hosting provider.
2. Apply migrations and seed the corpus.
3. Create Stripe test-mode products and register the webhook endpoint.
4. Deploy the application and complete sign-up, checkout, cancellation, quota,
   custom-cipher, history, research-table, CSV-export, share-link, and
   AstroNumeric event-chart smoke tests.
5. Confirm RLS with both a Free account and a paid test account.
6. Only then create live-mode Stripe prices and replace test credentials.
