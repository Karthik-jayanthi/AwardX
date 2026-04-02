import { describe, expect, it } from 'vitest';
import { deriveStripeConnectStatus } from '../../api/_utils/stripeConnect';

describe('deriveStripeConnectStatus', () => {
  it('marks account connected only when charges, payouts, and details are ready', () => {
    const connected = deriveStripeConnectStatus({
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
      requirements: {
        currently_due: [],
        eventually_due: [],
      },
    } as any);

    expect(connected.connected).toBe(true);
    expect(connected.onboardingCompleted).toBe(true);
    expect(connected.requirementsDue).toEqual([]);
  });

  it('marks account not connected when payouts are disabled', () => {
    const pending = deriveStripeConnectStatus({
      charges_enabled: true,
      payouts_enabled: false,
      details_submitted: true,
      requirements: {
        currently_due: ['external_account'],
        eventually_due: [],
        disabled_reason: 'requirements.past_due',
      },
    } as any);

    expect(pending.connected).toBe(false);
    expect(pending.payoutsEnabled).toBe(false);
    expect(pending.disabledReason).toBe('requirements.past_due');
    expect(pending.requirementsDue).toContain('external_account');
  });
});
