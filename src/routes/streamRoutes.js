import { Router } from 'express';
import * as streamController from '../controllers/streamController.js';
import { authenticate, requireSeller } from '../middlewares/auth.js';

const router = Router();

// Public streams discovery
router.get('/', streamController.getActiveStreams);
router.get('/active', streamController.getActiveStreams);

// Viewer actions (user authenticated)
router.get('/:id', authenticate, streamController.joinStream);
router.get('/:id/join', authenticate, streamController.joinStream);
router.post('/:id/leave', authenticate, streamController.leaveStream);

// Seller broadcast controls (seller protected)
router.get('/seller/selectable-products', authenticate, requireSeller, streamController.getSelectableProducts);
router.post('/', authenticate, requireSeller, streamController.createStream);
router.post('/seller', authenticate, requireSeller, streamController.createStream);
router.post('/seller/create', authenticate, requireSeller, streamController.createStream);
router.post('/seller/:id/end', authenticate, requireSeller, streamController.endStream);
router.post('/:id/end', authenticate, requireSeller, streamController.endStream);
router.post('/seller/:id/pin', authenticate, requireSeller, streamController.pinProduct);
router.post('/:id/pin', authenticate, requireSeller, streamController.pinProduct);

export default router;
