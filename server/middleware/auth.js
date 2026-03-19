import { ApiError } from '../utils/ApiError.js';
import { verifyAccess } from '../utils/jwt.js';

export const auth = (roles = []) => (req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new ApiError(401, 'No token'));
  try {
    const payload = verifyAccess(token);
    req.user = payload;
    if (roles.length && !roles.includes(payload.role)) {
      return next(new ApiError(403, 'Forbidden'));
    }
    next();
  } catch (e) {
    next(new ApiError(401, 'Invalid token'));
  }
};
