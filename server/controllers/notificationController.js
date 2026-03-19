import Notification from '../models/Notification.js';

export const listNotifications = async (req, res, next) => {
  try { res.json(await Notification.find({ user: req.user.id }).sort('-createdAt')); }
  catch (e) { next(e); }
};

export const markRead = async (req, res, next) => {
  try { res.json(await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true })); }
  catch (e) { next(e); }
};
