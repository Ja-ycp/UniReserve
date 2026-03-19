import { Router } from 'express';
import { listLibraries, updateRules } from '../controllers/libraryController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.get('/', auth(), listLibraries);
router.patch('/:id/rules', auth(['developer','librarian']), updateRules);
export default router;
