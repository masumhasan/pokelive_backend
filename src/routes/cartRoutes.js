import { Router } from 'express';
import * as cartController from '../controllers/cartController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', cartController.addItem);
router.post('/items', cartController.addItem);
router.put('/items/:id', cartController.updateItem);
router.delete('/items/:id', cartController.removeItem);

export default router;
