import { Router } from 'express';
import * as platformController from '../controllers/platformController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/settings/legal', platformController.getLegal);
router.post('/support/tickets', authenticate, platformController.submitSupportTicket);

export default router;
