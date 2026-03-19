import { Router } from 'express';
import { listGenres, createGenre, updateGenre, deleteGenre } from '../controllers/genreController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.get('/', auth(), listGenres);
router.post('/', auth(['developer','librarian']), createGenre);
router.patch('/:id', auth(['developer','librarian']), updateGenre);
router.delete('/:id', auth(['developer','librarian']), deleteGenre);
export default router;
