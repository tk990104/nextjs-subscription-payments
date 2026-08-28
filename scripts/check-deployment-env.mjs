const allowPlaceholders = process.argv.includes('--allow-placeholders');

const required = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

const errors = [];
const warnings = [];

for (const name of required) {
  if (!process.env[name]?.trim()) errors.push(`${name} is missing.`);
}

function parsedUrl(name) {
  const value = process.env[name];
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    errors.push(`${name} must be a valid URL.`);
    return null;
  }
}

const siteUrl = parsedUrl('NEXT_PUBLIC_SITE_URL');
const supabaseUrl = parsedUrl('NEXT_PUBLIC_SUPABASE_URL');
if (
  siteUrl &&
  siteUrl.protocol !== 'https:' &&
  !['localhost', '127.0.0.1'].includes(siteUrl.hostname)
) {
  errors.push('NEXT_PUBLIC_SITE_URL must use HTTPS outside local development.');
}
if (siteUrl && siteUrl.pathname !== '/') {
  errors.push('NEXT_PUBLIC_SITE_URL must not include a path.');
}
if (supabaseUrl && !['http:', 'https:'].includes(supabaseUrl.protocol)) {
  errors.push('NEXT_PUBLIC_SUPABASE_URL must use HTTP or HTTPS.');
}

const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const secret = process.env.STRIPE_SECRET_KEY ?? '';
const webhook = process.env.STRIPE_WEBHOOK_SECRET ?? '';
if (publishable && !/^pk_(test|live)_/.test(publishable)) {
  errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY has an invalid prefix.');
}
if (secret && !/^sk_(test|live)_/.test(secret)) {
  errors.push('STRIPE_SECRET_KEY has an invalid prefix.');
}
if (webhook && !/^whsec_/.test(webhook)) {
  errors.push('STRIPE_WEBHOOK_SECRET has an invalid prefix.');
}
if (
  publishable &&
  secret &&
  publishable.split('_')[1] !== secret.split('_')[1]
) {
  errors.push('Stripe publishable and secret keys must use the same mode.');
}

const adminIds = (process.env.GEMATRIA_ADMIN_USER_IDS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
for (const id of adminIds) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    )
  ) {
    errors.push(`GEMATRIA_ADMIN_USER_IDS contains an invalid UUID: ${id}`);
  }
}
if (!adminIds.length) {
  warnings.push('No corpus administrator is configured.');
}

const placeholderNames = required.filter((name) =>
  /placeholder|example/i.test(process.env[name] ?? '')
);
if (placeholderNames.length && !allowPlaceholders) {
  errors.push(`Placeholder values remain: ${placeholderNames.join(', ')}.`);
}

for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Deployment environment is valid (${allowPlaceholders ? 'placeholder validation' : 'real credentials'}).`
  );
}
