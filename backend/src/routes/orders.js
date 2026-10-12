import { Router } from 'express';
import { listOrders, placeOrder } from '../controllers/orders.js';

// mounted behind requireAuth + requireRole('customer') in app.js
const router = Router();

router.get('/', listOrders);
router.post('/', placeOrder);

export default router;
