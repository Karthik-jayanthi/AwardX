import crypto from 'crypto';
import { createSupabaseAdmin } from '../_utils/supabaseAdmin';
import { razorpayVerifySchema } from '../_utils/validation';
import { logError, logInfo, logWarn } from '../_utils/logger';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const parsed = razorpayVerifySchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request payload', details: parsed.error.flatten() });
    return;
  }

  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!razorpaySecret) {
    res.status(500).json({ error: 'RAZORPAY_KEY_SECRET not configured' });
    return;
  }

  const { submissionId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  try {
    const signaturePayload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(signaturePayload)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      logWarn('payments.razorpay_verify.signature_mismatch', { submissionId, razorpayOrderId });
      res.status(400).json({ error: 'Invalid payment signature' });
      return;
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from('submissions')
      .update({
        payment_status: 'paid',
        payment_id: razorpayPaymentId,
      })
      .eq('id', submissionId);

    if (error) {
      res.status(500).json({ error: error.message || 'Failed to update submission payment status' });
      return;
    }

    logInfo('payments.razorpay_verify.success', { submissionId, razorpayPaymentId });
    res.json({ ok: true });
  } catch (error: any) {
    logError('payments.razorpay_verify.exception', { message: error?.message, submissionId });
    res.status(500).json({ error: error?.message || 'Failed to verify Razorpay payment' });
  }
}
