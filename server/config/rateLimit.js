import { rateLimit } from 'express-rate-limit';

export const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' }
});
