import { Router } from 'express';
import * as raffleController from '../controllers/raffleController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Public raffle discovery & past winners
router.get('/', raffleController.getActive);
router.get('/active', raffleController.getActive);
router.get('/past-winners', raffleController.getPastWinners);

// Authenticated user entry
router.post('/enter', authenticate, raffleController.enter);

export default router;
