import { Router } from 'express';
import {
	deleteDish,
	updateDish,
	updateDishSchema,
} from '../controllers/dishes.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { checkObjectId, validateBody } from '../middleware/validate.js';

const vendorOnly = [requireAuth, requireRole('vendor')];

const router = Router();
router.param('id', checkObjectId);

router.patch('/:id', vendorOnly, validateBody(updateDishSchema), updateDish);
router.delete('/:id', vendorOnly, deleteDish);

export default router;
