import { z } from 'zod';
import { HttpError } from '../middleware/errors.js';
import { CartItem } from '../models/CartItem.js';
import { Dish } from '../models/Dish.js';
import { Restaurant } from '../models/Restaurant.js';
import { findOwnedRestaurant } from './restaurants.js';

const fields = {
	name: z
		.string()
		.trim()
		.min(2, 'Name must be at least 2 characters')
		.max(80),
	description: z.string().trim().max(300),
	price: z.number().min(0).max(100_000),
	isVeg: z.boolean(),
};

export const createDishSchema = z.object({
	...fields,
	description: fields.description.default(''),
	isVeg: fields.isVeg.default(true),
});

// PATCH only changes the fields that are sent
export const updateDishSchema = z
	.object(fields)
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: 'Send at least one field to change',
	});

const DUPLICATE_NAME = 'This restaurant already has a dish with that name';

// loads a dish and checks that the logged-in vendor owns its restaurant
async function findOwnedDish(id, user) {
	const dish = await Dish.findById(id).populate('restaurant', 'owner');
	if (!dish) {
		throw new HttpError(404, 'Dish not found');
	}
	if (!dish.restaurant?.owner.equals(user._id)) {
		throw new HttpError(
			403,
			'You can only change dishes in your own restaurants',
		);
	}
	return dish;
}

// GET /api/restaurants/:id/dishes
export async function listDishes(req, res) {
	const restaurant = await Restaurant.findById(req.params.id);
	if (!restaurant) {
		throw new HttpError(404, 'Restaurant not found');
	}
	res.json(
		await Dish.find({ restaurant: restaurant._id }).sort({
			createdAt: 1,
			_id: 1,
		}),
	);
}

// POST /api/restaurants/:id/dishes
export async function createDish(req, res) {
	const restaurant = await findOwnedRestaurant(req.params.id, req.user);
	try {
		const dish = await Dish.create({
			...req.body,
			restaurant: restaurant._id,
		});
		res.status(201).json(dish);
	} catch (err) {
		if (err.code === 11000) {
			throw new HttpError(409, DUPLICATE_NAME);
		}
		throw err;
	}
}

export async function updateDish(req, res) {
	const dish = await findOwnedDish(req.params.id, req.user);
	Object.assign(dish, req.body);
	try {
		await dish.save();
	} catch (err) {
		if (err.code === 11000) {
			throw new HttpError(409, DUPLICATE_NAME);
		}
		throw err;
	}
	res.json(dish.depopulate('restaurant'));
}

export async function deleteDish(req, res) {
	const dish = await findOwnedDish(req.params.id, req.user);
	await CartItem.deleteMany({ dish: dish._id });
	await dish.deleteOne();
	res.status(204).end();
}
