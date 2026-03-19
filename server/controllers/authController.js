import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccess, signRefresh, verifyRefresh, refreshCookieOptions } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;
const DUMMY_PASSWORD_HASH = '$2b$12$2m9qz4QwrvA.WBTMewdWVuG5I6lAf5BgU984wgKLF6ig84yYI6Fh2';

const sanitizeUser = (user) => {
  const safeUser = user.toObject();
  delete safeUser.password;
  return safeUser;
};

const clearLoginProtection = async (user) => {
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
};

const registerFailedLogin = async (user) => {
  const now = new Date();
  const nextAttempts = (user.failedLoginAttempts || 0) + 1;

  user.failedLoginAttempts = nextAttempts;
  user.lastFailedLoginAt = now;

  if (nextAttempts >= MAX_FAILED_LOGINS) {
    user.lockUntil = new Date(now.getTime() + LOCKOUT_MS);
  }

  await user.save();
  return user.lockUntil && user.lockUntil > now;
};

export const login = async (req, res, next) => {
  try {
    const rawId = req.body.id || '';
    const id = rawId.trim();
    const { password } = req.body;
    const user = await User.findOne({ $or: [{ schoolId: id }, { employeeId: id }] });
    if (!user) {
      await bcrypt.compare(password || '', DUMMY_PASSWORD_HASH);
      return next(new ApiError(401, 'Invalid credentials'));
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const retryAfterSeconds = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000);
      res.set('Retry-After', String(retryAfterSeconds));
      return next(new ApiError(429, `Too many failed login attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`));
    }

    if (user.lockUntil && user.lockUntil <= new Date()) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      const locked = await registerFailedLogin(user);
      if (locked) {
        res.set('Retry-After', String(Math.ceil(LOCKOUT_MS / 1000)));
        return next(new ApiError(429, `Too many failed login attempts. Try again in ${LOCKOUT_MINUTES} minute(s).`));
      }
      return next(new ApiError(401, 'Invalid credentials'));
    }

    await clearLoginProtection(user);

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    res.cookie('rt', refreshToken, refreshCookieOptions);
    res.json({ accessToken, user: sanitizeUser(user), mustChangePassword: user.firstLogin });
  } catch (e) { next(e); }
};

export const refresh = (req, res, next) => {
  try {
    const token = req.cookies?.rt;
    if (!token) return next(new ApiError(401, 'No refresh token'));
    const payload = verifyRefresh(token);
    const accessToken = signAccess({ _id: payload.id, role: payload.role });
    res.json({ accessToken });
  } catch (e) { next(new ApiError(401, 'Invalid refresh token')); }
};

export const logout = (_req, res) => {
  res.clearCookie('rt');
  res.json({ message: 'Logged out' });
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return next(new ApiError(404, 'User not found'));
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return next(new ApiError(400, 'Old password incorrect'));
    user.password = newPassword;
    user.firstLogin = false;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (e) { next(e); }
};
