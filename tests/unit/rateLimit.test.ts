import { describe, expect, it } from 'vitest';
import { enforceRateLimit } from '../../api/_utils/rateLimit';

describe('enforceRateLimit', () => {
  it('allows requests within the configured window', () => {
    const key = `unit-test-allow-${Date.now()}`;
    const first = enforceRateLimit(key, 2, 10_000);
    const second = enforceRateLimit(key, 2, 10_000);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });

  it('blocks after max requests are exceeded', () => {
    const key = `unit-test-block-${Date.now()}`;
    enforceRateLimit(key, 1, 10_000);
    const blocked = enforceRateLimit(key, 1, 10_000);

    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
