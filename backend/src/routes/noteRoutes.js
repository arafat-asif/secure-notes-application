import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { listNotes, getNote, createNote, updateNote, deleteNote, listAllNotes } from '../controllers/noteController.js';

const router = Router();
router.use(protect);
router.get('/admin/all', adminOnly, listAllNotes);
router.route('/').get(listNotes).post(createNote);
router.route('/:id').get(getNote).patch(updateNote).delete(deleteNote);
export default router;
