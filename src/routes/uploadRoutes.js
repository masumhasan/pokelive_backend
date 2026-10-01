import { Router } from 'express';
import { getPresignedUrl } from '../controllers/uploadController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.post('/presigned-url', getPresignedUrl);
router.post('/presign', getPresignedUrl);
router.post('/', getPresignedUrl);

export default router;
