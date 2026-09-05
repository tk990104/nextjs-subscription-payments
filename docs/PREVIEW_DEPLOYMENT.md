# Preview deployment runbook

This runbook creates a non-production preview from
`feat/gematria-foundation`. Keep Stripe in test mode and keep the pull request
draft until every smoke test passes.

## 1. Create the services

| Service  | Create                                         | Keep for the next steps                                                       |
| -------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| Supabase | A new hosted project                           | Project reference, project URL, anon key, service-role key, database password |
| Vercel   | Import `tk990104/nextjs-subscription-payments` | Project settings and generated preview domain                                 |
| Stripe   | Use the existing account in test mode          | Publishable key, secret key                                                   |

Never paste credentials into GitHub issues, pull-request comments, chat, or
tracked files. Enter them only in Supabase, Stripe, or Vercel secret fields.

## 2. Apply the database

From a trusted terminal with the Supabase CLI authenticated:

```bash
npm run supabase:link -- --project-ref YOUR_PROJECT_REF
npm run supabase:push
```

Review the project reference printed by the CLI before approving the push. The
push must apply the starter schema followed by the six dated gematria
migrations. Load `supabase/seed.sql` through the Supabase SQL editor after the
migrations succeed.

Then run `npm run supabase:generate-types` locally and compare the generated
types before committing them. Do not overwrite the checked-in overlay until the
generated schema has been reviewed.

## 3. Configure Vercel

Add these variables to the Vercel Preview environment for the feature branch:

| Variable                             | Source                                              |
| ------------------------------------ | --------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`               | Generated Vercel preview URL                        |
| `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project API settings                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Supabase project API settings                       |
| `SUPABASE_SERVICE_ROLE_KEY`          | Supabase project API settings; server-only          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test-mode API keys                           |
| `STRIPE_SECRET_KEY`                  | Stripe test-mode API keys; server-only              |
| `STRIPE_WEBHOOK_SECRET`              | Stripe test webhook created in step 5               |
| `GEMATRIA_ADMIN_USER_IDS`            | Supabase user UUIDs allowed to open `/admin/corpus` |

Run the same values locally without printing them:

```bash
npm run deployment:check
```

Redeploy the feature branch after the variables are saved.

## 4. Configure Supabase authentication

In Supabase Authentication URL Configuration:

| Setting      | Value                                       |
| ------------ | ------------------------------------------- |
| Site URL     | The preview deployment URL                  |
| Redirect URL | `https://YOUR_PREVIEW_DOMAIN/auth/callback` |

Create one Free test account and one account that will receive the
AstroNumeric test subscription. Copy the intended administrator account's
Supabase user UUID into `GEMATRIA_ADMIN_USER_IDS`.

## 5. Configure Stripe test mode

Run `npm run stripe:fixtures` only while the Stripe CLI is authenticated to the
correct test account. Review the provisional prices before creating them. Add a
test webhook endpoint for:

```text
https://YOUR_PREVIEW_DOMAIN/api/webhooks
```

Copy its signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`, then redeploy.

## 6. Automated smoke test

Run:

```bash
npm run smoke -- https://YOUR_PREVIEW_DOMAIN
```

The automated test checks liveness, public pages, authentication boundaries,
and invalid share-link handling. Then manually verify the account workflows:

| Account       | Required checks                                                                               |
| ------------- | --------------------------------------------------------------------------------------------- |
| Free          | Sign up, calculate, save history, use daily corpus matching, confirm paid tools remain locked |
| Researcher    | Custom cipher, saved preferences, research table, CSV export, public share and revoke         |
| AstroNumeric  | Event chart, motion/aspects, save event, confirm event appears in history                     |
| Administrator | Import a small CSV, confirm all 15 values, export the corpus                                  |

## 7. Release gate

Keep the PR in draft unless the deployment environment validates, migrations
and corpus seed succeed, GitHub CI is green, the automated smoke test passes,
and all four manual account checks above are complete.
