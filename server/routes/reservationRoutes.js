import { Router } from 'express';
import { requestReservation, approveReservation, rejectReservation, markBorrowed, returnReservation, myReservations, allReservations } from '../controllers/reservationController.js';
import { auth } from '../middleware/auth.js';
import { validateReservation } from '../middleware/validators.js';

const router = Router();
router.post('/', auth(['student','personnel','librarian','developer']), validateReservation, requestReservation);
router.get('/my', auth(['student','personnel','librarian','developer']), myReservations);
router.get('/', auth(['developer','librarian']), allReservations);
router.patch('/:id/approve', auth(['developer','librarian']), approveReservation);
router.patch('/:id/reject', auth(['developer','librarian']), rejectReservation);
router.patch('/:id/borrow', auth(['developer','librarian']), markBorrowed);
router.patch('/:id/return', auth(['developer','librarian']), returnReservation);
export default router;
