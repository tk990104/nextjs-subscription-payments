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

## Database matching model

`phrase_corpus` stores a phrase once. `phrase_cipher_values` stores its
precomputed value for each cipher and has an index on `(cipher_id, value)`.
This keeps exact-match searches fast without calculating every phrase during a
request. Corpus writes and usage-counter writes are reserved for trusted server
code.

## Next milestone

1. Connect authenticated calculation history and saved research tables.
2. Add the custom-cipher editor and enforce plan limits on the server.
3. Create the database-match API with atomic daily quota consumption.
4. Expand the clean-room cipher catalog with compatibility fixtures.
5. Add Astronomy Engine behind the AstroNumeric entitlement.
