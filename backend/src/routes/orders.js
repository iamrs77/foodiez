import { Router } from 'express';
import {
	cancelOrder,
	getOrder,
	listOrders,
	placeOrder,
	placeOrderSchema,
} from '../controllers/orders.js';
import { checkObjectId, validateBody } from '../middleware/validate.js';

// mounted behind requireAuth + requireRole('customer') in app.js
const router = Router();
router.param('id', checkObjectId);

router.get('/', listOrders);
router.post('/', validateBody(placeOrderSchema), placeOrder);
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);

export default router;
