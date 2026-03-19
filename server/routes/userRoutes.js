import { Router } from 'express';
import { createUser, listUsers, me, deleteUser, updateUser, updateMe } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.get('/me', auth(), me);
router.patch('/me', auth(), updateMe);
router.get('/', auth(['developer','librarian']), listUsers);
router.post('/', auth(['developer','librarian']), createUser);
router.patch('/:id', auth(['developer','librarian']), updateUser);
router.delete('/:id', auth(['developer','librarian']), deleteUser);
export default router;
