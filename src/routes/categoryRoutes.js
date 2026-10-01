import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticate, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', authenticate, requireRole('Admin'), categoryController.create);
router.put('/:id', authenticate, requireRole('Admin'), categoryController.update);
router.delete('/:id', authenticate, requireRole('Admin'), categoryController.remove);

export default router;
