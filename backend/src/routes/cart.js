import { Router } from 'express';
import {
	addItem,
	addItemSchema,
	clearCart,
	getCart,
	removeItem,
	updateItem,
	updateItemSchema,
} from '../controllers/cart.js';
import { checkObjectId, validateBody } from '../middleware/validate.js';

// mounted behind requireAuth + requireRole('customer') in app.js
const router = Router();
router.param('id', checkObjectId);

router.get('/', getCart);
router.delete('/', clearCart);
router.post('/items', validateBody(addItemSchema), addItem);
router.patch('/items/:id', validateBody(updateItemSchema), updateItem);
router.delete('/items/:id', removeItem);

export default router;
