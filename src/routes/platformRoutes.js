import { Router } from 'express';
import * as platformController from '../controllers/platformController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/legal', platformController.getLegal);
router.get('/settings/legal', platformController.getLegal);
router.post('/tickets', authenticate, platformController.submitSupportTicket);
router.post('/support/tickets', authenticate, platformController.submitSupportTicket);

export default router;
