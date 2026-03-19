import { Router } from 'express';
import { listFines, adminListFines, markPaid } from '../controllers/fineController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.get('/me', auth(), listFines);
router.get('/', auth(['developer','librarian']), adminListFines);
router.patch('/:id/pay', auth(['developer','librarian']), markPaid);
export default router;
