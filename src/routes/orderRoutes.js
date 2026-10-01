import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticate, requireSeller } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Buyer order checkout and history
router.post('/checkout-summary', orderController.getSummary);
router.post('/checkout', orderController.createOrder);
router.post('/create', orderController.createOrder);
router.post('/', orderController.createOrder);
router.get('/active', orderController.getActiveOrders);
router.get('/history', orderController.getOrderHistory);
router.get('/my-orders', orderController.getActiveOrders);

// Seller sales orders management
router.get('/seller', requireSeller, orderController.getSellerOrders);
router.put('/seller/:id/status', requireSeller, orderController.updateOrderStatus);

export default router;
