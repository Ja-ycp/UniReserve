import AuditLog from '../models/AuditLog.js';

export const audit = async (req, _res, next) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await AuditLog.create({ user: userId, action: `${req.method} ${req.originalUrl}`, ip: req.ip, userAgent: req.headers['user-agent'] });
    }
    next();
  } catch (e) { next(e); }
};
