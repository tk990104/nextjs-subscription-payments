const rawBaseUrl = process.argv[2] ?? process.env.SMOKE_TEST_URL;
if (!rawBaseUrl) {
  throw new Error(
    'Usage: node scripts/smoke-test.mjs https://preview.example.com'
  );
}
const baseUrl = new URL(rawBaseUrl);
if (baseUrl.protocol !== 'https:' && baseUrl.hostname !== 'localhost') {
  throw new Error('Smoke-test URL must use HTTPS outside localhost.');
}

const checks = [
  { name: 'health', path: '/api/health', status: 200 },
  { name: 'home page', path: '/', status: 200 },
  { name: 'calculator page', path: '/calculator', status: 200 },
  {
    name: 'history authentication',
    path: '/api/gematria/history',
    status: 401
  },
  {
    name: 'astronomy authentication',
    path: '/api/gematria/astronomy',
    status: 401,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}'
  },
  { name: 'invalid share token', path: '/share/not-a-token', status: 404 }
];

let failed = false;
for (const check of checks) {
  const response = await fetch(new URL(check.path, baseUrl), {
    method: check.method,
    headers: check.headers,
    body: check.body,
    redirect: 'manual'
  });
  const passed = response.status === check.status;
  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${check.name}: expected ${check.status}, received ${response.status}`
  );
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
