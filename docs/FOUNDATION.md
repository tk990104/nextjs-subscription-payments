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
  recalculated phrases with notes and source URLs. Paid tables export to CSV
  and can publish revocable, unguessable read-only report links.
- `/admin/corpus` imports and exports CSV batches for an explicit server-side
  administrator allowlist; imports recalculate all built-in values server-side.
- `/astronumeric` combines event-name gematria with tropical positions for the
  Sun, Moon, and eight planets, lunar phase, direct/retrograde motion, local
  horizon coordinates, and major aspects. Full charts can be saved only by the
  AstroNumeric plan.
- `/ciphers` creates plan-limited alphabet ciphers, previews their values, and
  adds valid definitions to calculator and saved-result calculations.
- `/api/gematria/*` resolves entitlements from the active Stripe product's
  `gematria_plan` metadata and never trusts results or limits from the browser.
- The built-in catalog includes ordinal/reduction, extended, prime, square,
  trigonal, Satanic-offset, and mirrored Septenary definitions plus reverse
  variants where applicable. All definitions are independently implemented
  from their documented numeric rules.
- Calculator cipher groups can be selected per session. Researcher, Pro, and
  AstroNumeric subscribers can persist their default built-in/custom set.
- `data/corpus.seed.json` and `scripts/build-corpus-seed.mjs` provide a
  reproducible starter phrase index with every built-in cipher precomputed.
- Astronomy calculations use the MIT-licensed Astronomy Engine 2.1.19 build
  pinned from `tk990104/astronomy` at commit
  `865d3da7d8112bbc7911238052c6af4aaf877181`. Provenance and update guidance
  live in `vendor/astronomy-engine.SOURCE.md`.

## Next milestone

1. Apply and smoke-test all migrations against the selected Supabase project.
2. Add historical cipher families only after their definitions have verified
   compatibility fixtures and provenance notes.
3. Add house systems, fixed stars, and configurable aspect sets after their
   calculation conventions are documented and tested.
4. Generate fresh database types from the deployed schema.
