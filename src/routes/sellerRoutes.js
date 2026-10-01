import { Router } from 'express';
import * as sellerController from '../controllers/sellerController.js';
import { authenticate, requireSeller } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Seller application & status check
router.post('/apply', sellerController.apply);
router.get('/application-status', sellerController.getApplicationStatus);
router.get('/status', sellerController.getApplicationStatus);

// Seller Hub operations (strictly seller-protected)
router.get('/hub-summary', requireSeller, sellerController.getHubSummary);
router.get('/hub/summary', requireSeller, sellerController.getHubSummary);
router.get('/storefront', requireSeller, sellerController.getStorefront);
router.put('/storefront', requireSeller, sellerController.updateStorefront);
router.get('/sender-address', requireSeller, sellerController.getSenderAddress);
router.put('/sender-address', requireSeller, sellerController.updateSenderAddress);
router.get('/payouts', requireSeller, sellerController.getPayouts);
router.post('/payouts/request', requireSeller, sellerController.requestPayout);

export default router;
