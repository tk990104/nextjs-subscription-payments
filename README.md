# Cipher Forge

Cipher Forge is a full-stack gematria research workspace built with Next.js,
Supabase, and Stripe. It combines fast local calculation with saved research,
corpus matching, custom ciphers, exports, sharing, and AstroNumeric event tools.

## Product surfaces

- **Calculator:** compare phrases across 15 built-in ciphers with transparent
  character-by-character breakdowns.
- **Corpus matching:** find phrases that share a value, with per-plan limits and
  a server-managed phrase corpus.
- **Cipher Studio:** create, preview, update, and delete account-owned ciphers.
- **Research Workspace:** organize findings into tables, attach notes and tags,
  export CSV files, and create revocable share links.
- **AstroNumeric Laboratory:** calculate planetary positions and save event
  charts for the AstroNumeric plan.
- **Subscriptions:** Stripe Checkout, customer portal, webhook syncing, and
  database-backed plan entitlements.

## Stack

- Next.js 16 and React 19
- TypeScript and Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security, and server-side clients
- Stripe Checkout, Billing Portal, and webhooks
- Vitest

## Local setup

Use Node.js 20.9 or newer.

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Required Supabase variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Stripe variables are optional until checkout is enabled:

```dotenv
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Database setup

For a new hosted Supabase project, run
[`supabase/cipher-forge-schema.sql`](./supabase/cipher-forge-schema.sql) once in
the SQL Editor, then run [`supabase/seed.sql`](./supabase/seed.sql). The schema
bundle mirrors the ordered migrations in [`supabase/migrations`](./supabase/migrations).

For local Supabase development:

```bash
npm run supabase:start
npm run supabase:reset
```

## Stripe setup

The included fixture creates three paid plans in Stripe test mode:

- Researcher: $9/month or $90/year
- Pro: $19/month or $190/year
- AstroNumeric: $29/month or $290/year

After authenticating the Stripe CLI, run:

```bash
npm run stripe:fixtures
```

Create a snapshot-event webhook that points to `/api/webhooks` and subscribes
to `customer.*`, `product.*`, `price.*`, `checkout.session.*`, `invoice.*`, and
`subscription.*`. Add its signing secret to `STRIPE_WEBHOOK_SECRET`, then
redeploy so the server receives the new environment variables.

Products must include the `gematria_plan` metadata used by the fixture:
`researcher`, `pro`, or `astronumeric`.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run corpus:check
npm run deployment:check
```

The deployment check validates required environment variables without printing
secret values.

## Security model

- The browser receives only the Supabase publishable key.
- The Supabase service-role key and Stripe secret keys are server-only.
- User-owned records are protected with Row Level Security policies.
- Privileged corpus and webhook operations run only in server contexts.
- Plan limits are enforced in the API/database layer, not only in the UI.
