import jwt from 'jsonwebtoken';

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

export const signAccess = (user) => jwt.sign({ id:user._id, role:user.role, library:user.library }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
export const signRefresh = (user) => jwt.sign({ id:user._id }, process.env.JWT_SECRET, { expiresIn: REFRESH_TTL });
export const verifyAccess = (token) => jwt.verify(token, process.env.JWT_SECRET);
export const verifyRefresh = (token) => jwt.verify(token, process.env.JWT_SECRET);

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};
