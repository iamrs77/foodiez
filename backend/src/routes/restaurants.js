import { Router } from 'express';
import {
	createDish,
	createDishSchema,
	listDishes,
} from '../controllers/dishes.js';
import {
	createRestaurant,
	createRestaurantSchema,
	deleteRestaurant,
	getRestaurant,
	listMyRestaurants,
	listRestaurants,
	updateRestaurant,
	updateRestaurantSchema,
} from '../controllers/restaurants.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { checkObjectId, validateBody } from '../middleware/validate.js';

const vendorOnly = [requireAuth, requireRole('vendor')];

const router = Router();
router.param('id', checkObjectId);

// anyone can browse restaurants and menus, only vendors can change them
router.get('/', listRestaurants);
router.get('/mine', vendorOnly, listMyRestaurants);
router.get('/:id', getRestaurant);
router.post(
	'/',
	vendorOnly,
	validateBody(createRestaurantSchema),
	createRestaurant,
);
router.patch(
	'/:id',
	vendorOnly,
	validateBody(updateRestaurantSchema),
	updateRestaurant,
);
router.delete('/:id', vendorOnly, deleteRestaurant);

router.get('/:id/dishes', listDishes);
router.post(
	'/:id/dishes',
	vendorOnly,
	validateBody(createDishSchema),
	createDish,
);

export default router;
