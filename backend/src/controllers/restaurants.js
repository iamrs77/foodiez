import { z } from 'zod';
import { HttpError } from '../middleware/errors.js';
import { CartItem } from '../models/CartItem.js';
import { Dish } from '../models/Dish.js';
import { Restaurant, searchWords } from '../models/Restaurant.js';
import { sameSandboxAs, sandboxOf } from '../models/Sandbox.js';

// a photo: '' for none, one of the app's own demo photos, or an https link
// (only https, so pages never load insecure images)
export const imageField = z.union([
	z.literal(''),
	z.string().regex(/^\/images\/(restaurants|dishes)\/[a-z0-9-]+\.webp$/),
	z
		.url({
			protocol: /^https$/,
			error: 'Use a link that starts with https://',
		})
		.max(500),
]);

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
	image: imageField,
};

export const createRestaurantSchema = z.object({
	...fields,
	image: fields.image.default(''),
});

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

const SORTS = {
	newest: { createdAt: -1, _id: -1 },
	fastest: { deliveryTimeMinutes: 1, _id: 1 },
	cheapest: { priceForTwo: 1, _id: 1 },
};

// a restaurant's cuisine is a list like "Italian, Pizza" or "Burgers & Fast Food"
const cuisineTags = (cuisine) =>
	cuisine
		.split(/\s*[,&/]\s*/)
		.map((tag) => tag.trim())
		.filter(Boolean);

// the restaurants (in one sandbox) whose menu has dishes, all of them veg
async function pureVegRestaurants(sandbox) {
	const [withDishes, withNonVeg] = await Promise.all([
		Dish.distinct('restaurant', { sandbox }),
		Dish.distinct('restaurant', { sandbox, isVeg: false }),
	]);
	const nonVeg = new Set(withNonVeg.map(String));
	return withDishes.filter((id) => !nonVeg.has(String(id)));
}

// GET /api/restaurants?search=piz&cuisine=Pizza&veg=true&sort=fastest
export async function listRestaurants(req, res) {
	const { search, cuisine, veg, sort } = req.query;
	const sandbox = sandboxOf(req.user);
	// a visitor in a demo sees only their own copy of the restaurants
	const filter = { sandbox };

	// every word typed must start one of the restaurant's search words: "north
	// ind" finds North Indian. Anchored at the start, each word can use the
	// (sandbox, searchTerms) index instead of reading every restaurant
	const words =
		typeof search === 'string' ? searchWords(search.slice(0, 50)) : [];
	if (words.length > 0) {
		filter.$and = words.slice(0, 5).map((word) => ({
			searchTerms: { $regex: `^${escapeRegex(word)}` },
		}));
	}
	if (typeof cuisine === 'string' && cuisine.trim()) {
		filter.cuisine = new RegExp(
			`(^|[,&/])\\s*${escapeRegex(cuisine.trim())}\\s*($|[,&/])`,
			'i',
		);
	}

	const pureVegIds = await pureVegRestaurants(sandbox);
	if (veg === 'true') {
		filter._id = { $in: pureVegIds };
	}

	const restaurants = await Restaurant.find(filter).sort(
		Object.hasOwn(SORTS, sort) ? SORTS[sort] : SORTS.newest,
	);
	const pureVeg = new Set(pureVegIds.map(String));
	res.json(
		restaurants.map((restaurant) => ({
			...restaurant.toJSON(),
			pureVeg: pureVeg.has(restaurant.id),
		})),
	);
}

// GET /api/restaurants/cuisines: the cuisines to filter by, most common first
export async function listCuisines(req, res) {
	const cuisines = await Restaurant.find({ sandbox: sandboxOf(req.user) })
		.select('cuisine')
		.lean();
	const counts = new Map();
	for (const { cuisine } of cuisines) {
		for (const tag of cuisineTags(cuisine)) {
			const key = tag.toLowerCase();
			const entry = counts.get(key) ?? { name: tag, count: 0 };
			entry.count += 1;
			counts.set(key, entry);
		}
	}
	res.json(
		[...counts.values()]
			.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
			.map((entry) => entry.name),
	);
}

export async function listMyRestaurants(req, res) {
	res.json(
		await Restaurant.find({ owner: req.user._id }).sort({
			createdAt: -1,
			_id: -1,
		}),
	);
}

export async function getRestaurant(req, res) {
	const restaurant = await Restaurant.findOne({
		_id: req.params.id,
		sandbox: sandboxOf(req.user),
	});
	if (!restaurant) {
		throw new HttpError(404, 'Restaurant not found');
	}
	res.json(restaurant);
}

export async function createRestaurant(req, res) {
	const restaurant = await Restaurant.create({
		...req.body,
		owner: req.user._id,
		...sameSandboxAs(req.user),
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
