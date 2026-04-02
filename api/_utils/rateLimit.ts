type RateLimitResult = {
  ok: boolean;
  retryAfterSeconds: number;
};

type HitMap = Map<string, number[]>;

const rateLimitStore: HitMap = new Map();

export const getClientIp = (req: any): string => {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
};

export const enforceRateLimit = (key: string, maxRequests: number, windowMs: number): RateLimitResult => {
  const now = Date.now();
  const windowStart = now - windowMs;

  const existingHits = rateLimitStore.get(key) || [];
  const freshHits = existingHits.filter((timestamp) => timestamp > windowStart);

  if (freshHits.length >= maxRequests) {
    const oldestHit = freshHits[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestHit + windowMs - now) / 1000));
    rateLimitStore.set(key, freshHits);
    return { ok: false, retryAfterSeconds };
  }

  freshHits.push(now);
  rateLimitStore.set(key, freshHits);
  return { ok: true, retryAfterSeconds: 0 };
};
