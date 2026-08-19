import rateLimit from 'express-rate-limit';

// Strict limiter for authentication (login, signup, reset password)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'TOO_MANY_REQUESTS',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    code: 'TOO_MANY_REQUESTS',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Forum post / creation limiter
export const forumLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  message: {
    success: false,
    message: 'You are posting too quickly. Please wait a moment.',
    code: 'RATE_LIMIT_FORUM',
  },
});
