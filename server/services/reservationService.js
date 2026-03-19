import dayjs from 'dayjs';
import Reservation from '../models/Reservation.js';
import Resource from '../models/Resource.js';
import Fine from '../models/Fine.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const defaultDurations = { book:7, laptop:3, projector:3, projector_screen:3 };

const notifyStaff = async (reservation, message, type) => {
  const resource = await Resource.findById(reservation.resource).populate('library');
  const librarians = await User.find({ role:'librarian', library: resource.library });
  const developers = await User.find({ role:'developer' });
  const targets = [...librarians, ...developers];
  await Promise.all(targets.map(u=> Notification.create({ user:u._id, type, message, meta:{ reservation: reservation._id } })));
};

export const request = async ({ userId, resourceId, requestedDate }) => {
  const resource = await Resource.findById(resourceId);
  if (!resource) throw new ApiError(404, 'Resource not found');
  const requested = requestedDate ? dayjs(requestedDate).startOf('day') : dayjs().startOf('day');
  if (!requested.isValid()) throw new ApiError(400, 'Invalid requested date');
  if (requested.isBefore(dayjs().startOf('day'))) throw new ApiError(400, 'Requested date cannot be in the past');
  const existing = await Reservation.findOne({ user:userId, resource:resourceId, status:{ $in:['pending','approved','borrowed','overdue'] }});
  if (existing) throw new ApiError(400,'You already have an active reservation for this item');
  const reservation = await Reservation.create({
    user: userId,
    resource: resourceId,
    status: 'pending',
    requestedDate: requested.toDate()
  });
  await notifyStaff(reservation, 'New reservation request', 'pending');
  return reservation;
};

export const approve = async ({ reservationId, librarianId, dueDate }) => {
  const r = await Reservation.findById(reservationId).populate({ path:'resource', populate:'library' });
  if (!r) throw new ApiError(404, 'Reservation not found');
  if (r.status !== 'pending') throw new ApiError(400,'Only pending reservations can be approved');
  if (r.resource.availableQuantity <= 0) throw new ApiError(400, 'Not available');
  if (!dueDate) throw new ApiError(400, 'Due date required');
  // librarian must match library
  if (r.resource.library && librarianId) {
    const librarian = await User.findById(librarianId);
    if (librarian?.role === 'librarian' && String(librarian.library) !== String(r.resource.library._id || r.resource.library)) {
      throw new ApiError(403,'Cannot approve items outside your library');
    }
  }
  r.status = 'approved';
  r.dueDate = dueDate;
  r.queuePosition = null;
  r.resource.availableQuantity = Math.max(0, (r.resource.availableQuantity || 0) - 1);
  await Promise.all([
    r.save(),
    r.resource.save(),
    Notification.create({ user: r.user, type: 'approval', message: 'Reservation approved', meta: { reservation: r._id } })
  ]);
  return r;
};

export const reject = async ({ reservationId }) => {
  const r = await Reservation.findById(reservationId);
  if (!r) throw new ApiError(404, 'Reservation not found');
  if (r.status !== 'pending') throw new ApiError(400,'Only pending reservations can be rejected');
  r.status = 'rejected';
  r.queuePosition = null;
  await r.save();
  await Notification.create({ user: r.user, type: 'rejection', message: 'Reservation rejected', meta:{ reservation:r._id } });
  return r;
};

export const borrow = async ({ reservationId }) => {
  const r = await Reservation.findById(reservationId);
  if (!r) throw new ApiError(404, 'Reservation not found');
  if (r.status !== 'approved') throw new ApiError(400,'Only approved reservations can be borrowed');
  r.status = 'borrowed';
  r.borrowDate = new Date();
  await r.save();
  return r;
};

export const returnItem = async ({ reservationId, returnDate }) => {
  const r = await Reservation.findById(reservationId).populate('resource');
  if (!r) throw new ApiError(404, 'Reservation not found');
  if (!['borrowed','overdue','approved'].includes(r.status)) throw new ApiError(400,'Cannot return this reservation');
  if (r.status === 'returned') throw new ApiError(400,'Already returned');
  r.status = 'returned';
  r.returnDate = returnDate;
  if (r.resource && typeof r.resource.availableQuantity === 'number') {
    r.resource.availableQuantity = (r.resource.availableQuantity || 0) + 1;
  }
  const daysLate = Math.max(0, dayjs(returnDate).diff(dayjs(r.dueDate), 'day'));
  let fineDoc = null;
  if (daysLate > 0) {
    const amount = 10 * daysLate;
    fineDoc = await Fine.create({ user: r.user, reservation: r._id, amount });
    await Notification.create({ user: r.user, type: 'fine', message: `Late return fine PHP ${amount}` });
    await notifyStaff(r, `User has returned late with fine PHP ${amount}`, 'fine');
  }
  await Promise.all([r.save(), r.resource?.save()]);
  return { reservation: r, fine: fineDoc };
};

export const listByUser = (userId) => Reservation.find({ user: userId }).populate({ path:'resource', populate:'library' }).populate('user');

export const remindDueSoon = async () => {
  const now = dayjs();
  const soon = now.add(1, 'day');
  const list = await Reservation.find({ status: { $in: ['approved','borrowed'] }, dueDate: { $gt: now.toDate(), $lte: soon.toDate() }, dueSoonNotified:false });
  for (const r of list) {
    await Notification.create({ user: r.user, type: 'due', message: 'Item due soon', meta:{ reservation:r._id, dueDate:r.dueDate } });
    r.dueSoonNotified = true;
    await r.save();
  }
};

export const markOverdue = async () => {
  const now = new Date();
  const overdue = await Reservation.find({ status: { $in: ['approved', 'borrowed'] }, dueDate: { $lt: now } });
  for (const r of overdue) {
    r.status = 'overdue';
    const daysLate = dayjs(now).diff(dayjs(r.dueDate), 'day');
    const amount = 10 * daysLate;
    const existingFine = await Fine.findOne({ reservation: r._id });
    if (existingFine && existingFine.paid) {
      // don't overwrite paid fine
    } else {
      await Fine.updateOne({ reservation: r._id }, { user: r.user, reservation: r._id, amount, paid:false }, { upsert: true });
    }
    await Promise.all([
      r.save(),
      Notification.create({ user: r.user, type: 'overdue', message: `Overdue by ${daysLate} day(s)` })
    ]);
    if (!r.overdueNotified) {
      await notifyStaff(r, `Reservation overdue (${daysLate} day/s)`, 'overdue');
      r.overdueNotified = true;
      await r.save();
    }
  }
};

export const suggestedDueDate = (resourceType, requestedDate)=>{
  const days = defaultDurations[resourceType] || 7;
  const start = dayjs(requestedDate || undefined);
  return start.add(days, 'day').format('YYYY-MM-DD');
};

