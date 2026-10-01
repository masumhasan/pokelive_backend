import { Router } from 'express';
import { getStoreDetails } from '../controllers/storeController.js';

const router = Router();

router.get('/:id', getStoreDetails);

export default router;
