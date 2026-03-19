import * as reservationService from '../services/reservationService.js';
import Reservation from '../models/Reservation.js';

export const requestReservation = async (req, res, next) => {
  try {
    res.status(201).json(await reservationService.request({
      userId: req.user.id,
      resourceId: req.body.resourceId,
      requestedDate: req.body.requestedDate
    }));
  }
  catch (e) { next(e); }
};

export const approveReservation = async (req, res, next) => {
  try { res.json(await reservationService.approve({ reservationId:req.params.id, librarianId:req.user.id, dueDate:req.body.dueDate })); }
  catch (e) { next(e); }
};

export const rejectReservation = async (req, res, next) => {
  try { res.json(await reservationService.reject({ reservationId:req.params.id, librarianId:req.user.id, reason:req.body.reason })); }
  catch (e) { next(e); }
};

export const markBorrowed = async (req, res, next) => {
  try { res.json(await reservationService.borrow({ reservationId:req.params.id })); }
  catch (e) { next(e); }
};

export const returnReservation = async (req, res, next) => {
  try { res.json(await reservationService.returnItem({ reservationId:req.params.id, returnDate:req.body.returnDate || new Date() })); }
  catch (e) { next(e); }
};

export const myReservations = async (req, res, next) => {
  try { res.json(await reservationService.listByUser(req.user.id)); }
  catch (e) { next(e); }
};

export const allReservations = async (req, res, next) => {
  try {
    const baseQuery = {};
    if (req.user?.role === 'librarian') baseQuery.library = req.user.library;
    const data = await Reservation.find(baseQuery)
      .populate('user')
      .populate({ path:'resource', populate:'library' });
    res.json(data);
  } catch (e) { next(e); }
};
