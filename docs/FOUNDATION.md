# Gematria platform foundation

This milestone turns the subscription starter into the independent foundation
for a commercial gematria research platform.

## Boundaries

- `lib/gematria` is a clean TypeScript implementation of public mathematical
  cipher definitions. It does not copy source from the GPL or AGPL calculators.
- The forked calculators are compatibility references. Their outputs can be
  captured as test fixtures after their provenance is reviewed.
- Stripe product metadata selects a plan with the `gematria_plan` key. Supported
  values are `free`, `researcher`, `pro`, and `astronumeric`; no Stripe price ID
  is hard-coded into application code.
- Supabase Row Level Security isolates histories, preferences, custom ciphers,
  and research tables by authenticated user.
- Paid-feature writes run through authenticated server routes. Atomic PostgreSQL
  functions enforce history, research-table, and daily corpus-search limits;
  those functions are executable only by the Supabase service role.

## Database matching model

`phrase_corpus` stores a phrase once. `phrase_cipher_values` stores its
precomputed value for each cipher and has an index on `(cipher_id, value)`.
This keeps exact-match searches fast without calculating every phrase during a
request. Corpus writes and usage-counter writes are reserved for trusted server
code.

## Implemented application paths

- `/calculator` calculates locally, saves authenticated history, and runs
  quota-controlled exact-value searches against the phrase corpus.
- `/research` creates plan-limited research tables and stores independently
  recalculated phrases with notes and source URLs.
- `/ciphers` creates plan-limited alphabet ciphers, previews their values, and
  adds valid definitions to calculator and saved-result calculations.
- `/api/gematria/*` resolves entitlements from the active Stripe product's
  `gematria_plan` metadata and never trusts results or limits from the browser.
- `data/corpus.seed.json` and `scripts/build-corpus-seed.mjs` provide a
  reproducible starter phrase index with precomputed core-cipher values.

## Next milestone

1. Apply and smoke-test all migrations against the selected Supabase project.
2. Expand the clean-room cipher catalog with compatibility fixtures.
3. Add a bulk corpus administration screen around the seed generator.
4. Add Astronomy Engine behind the AstroNumeric entitlement.
5. Generate fresh database types from the deployed schema.
