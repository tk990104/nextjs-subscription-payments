import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('deployment health endpoint', () => {
  it('returns a no-store liveness response without exposing secrets', async () => {
    const response = GET();
    const body = (await response.json()) as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.status).toBe('ok');
    expect(JSON.stringify(body)).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });
});
