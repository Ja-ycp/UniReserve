import { Router } from 'express';
import multer from 'multer';
import { listResources, getResourceById, createResource, updateResource, deleteResource } from '../controllers/resourceController.js';
import { auth } from '../middleware/auth.js';

const upload = multer({ dest: 'uploads/' });
const router = Router();
router.get('/', auth(), listResources);
router.get('/:id', auth(), getResourceById);
router.post('/', auth(['developer','librarian']), upload.single('cover'), createResource);
router.patch('/:id', auth(['developer','librarian']), upload.single('cover'), updateResource);
router.delete('/:id', auth(['developer','librarian']), deleteResource);
export default router;
