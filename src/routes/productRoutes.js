import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { authenticate, requireSeller } from '../middlewares/auth.js';

const router = Router();

// Public routes
router.get('/', productController.listAll);
router.get('/:id', productController.getDetails);
router.get('/:id/reviews', productController.getReviews);

// Seller protected routes (supports both /products and /products/seller)
router.post('/', authenticate, requireSeller, productController.create);
router.post('/seller', authenticate, requireSeller, productController.create);
router.get('/seller/inventory', authenticate, requireSeller, productController.getSellerInventory);
router.put('/seller/:id', authenticate, requireSeller, productController.update);
router.put('/:id', authenticate, requireSeller, productController.update);
router.delete('/seller/:id', authenticate, requireSeller, productController.remove);
router.delete('/:id', authenticate, requireSeller, productController.remove);

// Authenticated user review submission
router.post('/:id/reviews', authenticate, productController.addReview);

export default router;
