// backend/src/routes/mpesaRoutes.ts
import { Router } from 'express'; // 👈 THIS was missing!
import { handleC2BNotification } from '../controllers/mpesaController';

const router = Router();

// This creates: POST /api/payments/webhook
router.post('/webhook', handleC2BNotification);

export default router;