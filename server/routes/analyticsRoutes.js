import { Router } from 'express';
import { summary } from '../controllers/analyticsController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.get('/summary', auth(['developer','librarian']), summary);
export default router;
