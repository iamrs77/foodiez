import { Router } from 'express';
import {
	listVendorOrders,
	updateOrderStatus,
	updateStatusSchema,
} from '../controllers/orders.js';
import { checkObjectId, validateBody } from '../middleware/validate.js';

// the orders for a vendor's restaurants; mounted behind requireAuth +
// requireRole('vendor') in app.js
const router = Router();
router.param('id', checkObjectId);

router.get('/', listVendorOrders);
router.patch('/:id', validateBody(updateStatusSchema), updateOrderStatus);

export default router;
