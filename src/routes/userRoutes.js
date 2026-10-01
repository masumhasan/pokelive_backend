import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Protected user routes
router.use(authenticate);

router.get('/me', userController.getMe);
router.get('/profile', userController.getMe);
router.put('/me', userController.updateMe);
router.put('/profile', userController.updateMe);
router.put('/change-password', userController.changePassword);

// Shipping address book
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.createAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);

export default router;
