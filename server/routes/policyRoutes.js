import { Router } from 'express';
import { listPolicies, createPolicy, updatePolicy, deletePolicy } from '../controllers/policyController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.get('/', listPolicies);
router.post('/', auth(['developer','librarian']), createPolicy);
router.patch('/:id', auth(['developer','librarian']), updatePolicy);
router.delete('/:id', auth(['developer','librarian']), deletePolicy);
export default router;
