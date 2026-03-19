import { Router } from 'express';
import { login, refresh, logout, changePassword } from '../controllers/authController.js';
import { validateLogin, validatePasswordChange } from '../middleware/validators.js';
import { auth } from '../middleware/auth.js';
import { loginLimiter } from '../config/rateLimit.js';

const router = Router();
router.post('/login', loginLimiter, validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/change-password', auth(), validatePasswordChange, changePassword);
export default router;
