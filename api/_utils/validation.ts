import { z } from 'zod';

export const teamInviteSchema = z.object({
  email: z.string().email(),
  roleName: z.string().trim().min(1).max(100).optional(),
  programTitle: z.string().trim().min(1).max(200),
  inviteUrl: z.string().trim().url().optional(),
});

export const judgeInviteSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(120).optional(),
  programTitle: z.string().trim().min(1).max(200),
  inviteUrl: z.string().trim().url().optional(),
});

export const verifyJudgeSchema = z.object({
  token: z.string().uuid(),
});

export const newSubmissionNotificationSchema = z.object({
  organizationId: z.string().uuid(),
  programId: z.string().uuid(),
  submissionId: z.string().uuid(),
  submissionTitle: z.string().trim().min(1).max(200),
  applicantName: z.string().trim().min(1).max(160).optional(),
});

export const judgeAssignedNotificationSchema = z.object({
  organizationId: z.string().uuid(),
  programId: z.string().uuid(),
  submissionId: z.string().uuid(),
  judgeId: z.string().uuid(),
  judgeName: z.string().trim().min(1).max(160),
  submissionTitle: z.string().trim().min(1).max(200),
});

export const deadlineApproachingNotificationSchema = z.object({
  organizationId: z.string().uuid(),
  programId: z.string().uuid(),
  programTitle: z.string().trim().min(1).max(200),
  deadlineIso: z.string().datetime(),
});

export const createCheckoutSchema = z.object({
  submissionId: z.string().uuid(),
  programId: z.string().uuid(),
  formId: z.string().uuid().optional(),
  currency: z.string().trim().min(3).max(3).optional(),
});

export const stripeWebhookFallbackSchema = z.object({
  type: z.string().trim().min(1),
  data: z.object({
    object: z.record(z.any()),
  }),
});

export const stripeConnectStartSchema = z.object({
  programId: z.string().uuid(),
});

export const stripeConnectStatusSchema = z.object({
  programId: z.string().uuid(),
});

export const withdrawSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500).optional(),
});

export const razorpayVerifySchema = z.object({
  submissionId: z.string().uuid(),
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
});
