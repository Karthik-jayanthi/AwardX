import Stripe from 'stripe';
import { createSupabaseAdmin } from '../_utils/supabaseAdmin';
import { stripeConnectStartSchema } from '../_utils/validation';
import { logError, logInfo, logWarn } from '../_utils/logger';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const parseResult = stripeConnectStartSchema.safeParse({ programId: req.query?.programId });
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid program id', details: parseResult.error.flatten() });
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
  if (!stripeSecretKey) {
    res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
    return;
  }

  const stripe = new Stripe(stripeSecretKey);
  const { programId } = parseResult.data;

  try {
    const supabase = createSupabaseAdmin();
    const { data: paymentConfig } = await supabase
      .from('program_payment_configs')
      .select('id, provider_account_id, provider')
      .eq('program_id', programId)
      .maybeSingle();

    let accountId = paymentConfig?.provider_account_id || '';
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      await supabase
        .from('program_payment_configs')
        .upsert(
          {
            program_id: programId,
            provider: 'stripe',
            provider_account_id: accountId,
            connected: false,
            onboarding_completed: false,
            provider_metadata: {
              accountId,
              accountType: account.type,
              country: account.country,
              defaultCurrency: account.default_currency,
              createdAt: new Date().toISOString(),
            },
          },
          { onConflict: 'program_id' }
        );
    }

    const requestOrigin = typeof req.headers?.origin === 'string' ? req.headers.origin : undefined;
    const siteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || requestOrigin || 'http://localhost:3000';

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${siteUrl}/dashboard?view=settings&tab=billing&programId=${programId}&stripe=refresh`,
      return_url: `${siteUrl}/dashboard?view=settings&tab=billing&programId=${programId}&stripe=connected`,
    });

    logInfo('payments.stripe_connect_start.created', { programId, accountId });
    res.redirect(302, accountLink.url);
  } catch (error: any) {
    logError('payments.stripe_connect_start.exception', { message: error?.message, programId });
    res.status(500).json({ error: error?.message || 'Failed to start Stripe Connect onboarding' });
  }
}
