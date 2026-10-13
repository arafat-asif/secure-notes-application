import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = Router();
router.use(protect, adminOnly);
router.route('/').get(listUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);
export default router;
