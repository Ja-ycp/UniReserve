import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const isLibrarian = (role)=> role === 'librarian';
const isDeveloper = (role)=> role === 'developer';

const cleanIds = (payload)=>{
  if (payload.schoolId === '') delete payload.schoolId;
  if (payload.employeeId === '') delete payload.employeeId;
};

const enforceIdRules = (payload)=>{
  if (payload.role === 'student' && !payload.schoolId) throw new ApiError(400,'schoolId is required for students');
  if (payload.role === 'personnel' && !payload.employeeId) throw new ApiError(400,'employeeId is required for personnel');
  if (payload.role === 'librarian' && !payload.employeeId) throw new ApiError(400,'employeeId is required for librarians');
};

const enforcePassword = (payload)=>{
  if (payload.password !== undefined && payload.password.length < 8) throw new ApiError(400,'Password must be at least 8 characters');
};

const allowedFields = (requester, target, body) => {
  const fields = {};
  const setIf = (key)=> { if (body[key] !== undefined) fields[key] = body[key]; };

  if (requester.id === String(target._id)) {
    ['fullName','password','profilePhoto'].forEach(setIf);
    return fields;
  }

  if (isDeveloper(requester.role)) {
    ['fullName','password','role','library','schoolId','employeeId','course','yearLevel','department','profilePhoto'].forEach(setIf);
    return fields;
  }

  if (isLibrarian(requester.role)) {
    ['fullName','password','course','yearLevel','department','profilePhoto'].forEach(setIf);
    return fields;
  }

  return fields;
};

export const createUser = async (req, res, next) => {
  try {
    const requester = req.user;
    const payload = { ...req.body };
    cleanIds(payload);
    if (isLibrarian(requester.role)) {
      if (!['student','personnel'].includes(payload.role)) return next(new ApiError(403,'Librarians can only create student/personnel'));
      payload.library = requester.library;
    }
    enforceIdRules(payload);
    enforcePassword(payload);
    payload.firstLogin = true;
    const user = await User.create(payload);
    res.status(201).json(user);
  } catch (e) { next(e); }
};

export const listUsers = async (req, res, next) => {
  try {
    const requester = req.user;
    const { q } = req.query;
    const filter = { _id: { $ne: requester.id }, role: { $ne: 'developer' } }; // hide self and developers
    if (isLibrarian(requester.role)) {
      filter.role.$in = ['student','personnel'];
      filter.library = requester.library;
    }
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { fullName: regex },
        { schoolId: regex },
        { employeeId: regex }
      ];
    }
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (e) { next(e); }
};

export const updateUser = async (req, res, next) => {
  try {
    const requester = req.user;
    const target = await User.findById(req.params.id);
    if (!target) return next(new ApiError(404,'User not found'));
    const selfUpdate = requester.id === String(target._id);
    if (target.role === 'developer' && !selfUpdate) return next(new ApiError(403,'Cannot modify developer accounts'));

    if (isLibrarian(requester.role) && !selfUpdate) {
      if (!['student','personnel'].includes(target.role)) return next(new ApiError(403,'Librarians can only update student/personnel'));
      if (String(target.library) !== String(requester.library)) return next(new ApiError(403,'Cannot update outside your library'));
    }

    const updates = allowedFields(requester, target, req.body);
    cleanIds(updates);
    enforceIdRules({ ...target.toObject(), ...updates });
    enforcePassword(updates);
    Object.assign(target, updates);
    await target.save();
    res.json(target);
  } catch (e) { next(e); }
};

export const deleteUser = async (req, res, next) => {
  try {
    const requester = req.user;
    const target = await User.findById(req.params.id);
    if (!target) return next(new ApiError(404,'User not found'));
    if (target.role === 'developer') return next(new ApiError(403,'Cannot delete developer accounts'));
    if (isLibrarian(requester.role)) {
      if (!['student','personnel'].includes(target.role)) return next(new ApiError(403,'Librarians can only delete student/personnel'));
      if (String(target.library) !== String(requester.library)) return next(new ApiError(403,'Cannot delete outside your library'));
    }
    await target.deleteOne();
    res.json({ message:'Deleted' });
  } catch (e) { next(e); }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return next(new ApiError(404, 'User not found'));
    res.json(user);
  } catch (e) { next(e); }
};

export const updateMe = async (req, res, next) => {
  try {
    req.params.id = req.user.id;
    return updateUser(req, res, next);
  } catch (e) { next(e); }
};
