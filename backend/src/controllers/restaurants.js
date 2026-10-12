import { z } from 'zod';
import { HttpError } from '../middleware/errors.js';
import { CartItem } from '../models/CartItem.js';
import { Dish } from '../models/Dish.js';
import { Restaurant } from '../models/Restaurant.js';

const fields = {
	name: z
		.string()
		.trim()
		.min(2, 'Name must be at least 2 characters')
		.max(80),
	cuisine: z
		.string()
		.trim()
		.min(2, 'Cuisine must be at least 2 characters')
		.max(60),
	location: z
		.string()
		.trim()
		.min(2, 'Location must be at least 2 characters')
		.max(120),
	priceForTwo: z.number().int().min(0).max(100_000),
	deliveryTimeMinutes: z.number().int().min(5).max(180),
};

export const createRestaurantSchema = z.object(fields);

// PATCH only changes the fields that are sent
export const updateRestaurantSchema = z
	.object(fields)
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: 'Send at least one field to change',
	});

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// loads a restaurant and checks that the logged-in vendor owns it
export async function findOwnedRestaurant(id, user) {
	const restaurant = await Restaurant.findById(id);
	if (!restaurant) {
		throw new HttpError(404, 'Restaurant not found');
	}
	if (!restaurant.owner.equals(user._id)) {
		throw new HttpError(403, 'You can only change your own restaurants');
	}
	return restaurant;
}

// GET /api/restaurants?search=pizza
export async function listRestaurants(req, res) {
	const search =
		typeof req.query.search === 'string'
			? req.query.search.trim().slice(0, 50)
			: '';

	let filter = {};
	if (search) {
		const pattern = new RegExp(escapeRegex(search), 'i');
		filter = {
			$or: [
				{ name: pattern },
				{ cuisine: pattern },
				{ location: pattern },
			],
		};
	}

	res.json(await Restaurant.find(filter).sort({ createdAt: -1 }));
}

export async function listMyRestaurants(req, res) {
	res.json(
		await Restaurant.find({ owner: req.user._id }).sort({ createdAt: -1 }),
	);
}

export async function getRestaurant(req, res) {
	const restaurant = await Restaurant.findById(req.params.id);
	if (!restaurant) {
		throw new HttpError(404, 'Restaurant not found');
	}
	res.json(restaurant);
}

export async function createRestaurant(req, res) {
	const restaurant = await Restaurant.create({
		...req.body,
		owner: req.user._id,
	});
	res.status(201).json(restaurant);
}

export async function updateRestaurant(req, res) {
	const restaurant = await findOwnedRestaurant(req.params.id, req.user);
	Object.assign(restaurant, req.body);
	await restaurant.save();
	res.json(restaurant);
}

export async function deleteRestaurant(req, res) {
	const restaurant = await findOwnedRestaurant(req.params.id, req.user);

	// also remove its dishes, and take them out of any cart
	const dishIds = await Dish.find({ restaurant: restaurant._id }).distinct(
		'_id',
	);
	await CartItem.deleteMany({ dish: { $in: dishIds } });
	await Dish.deleteMany({ restaurant: restaurant._id });
	await restaurant.deleteOne();

	res.status(204).end();
}
