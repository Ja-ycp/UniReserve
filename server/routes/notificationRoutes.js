import { Router } from 'express';
import { listNotifications, markRead } from '../controllers/notificationController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.get('/', auth(), listNotifications);
router.patch('/:id/read', auth(), markRead);
export default router;
