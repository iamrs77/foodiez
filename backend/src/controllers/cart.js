import mongoose from 'mongoose';
import { z } from 'zod';
import { HttpError } from '../middleware/errors.js';
import { CartItem, MAX_QUANTITY } from '../models/CartItem.js';
import { Dish } from '../models/Dish.js';

const quantity = z.number().int().min(1).max(MAX_QUANTITY);

export const addItemSchema = z.object({
	dishId: z.string().refine(mongoose.isValidObjectId, 'Invalid dish id'),
	quantity: quantity.default(1),
});

export const updateItemSchema = z.object({ quantity });

// the cart as the web app shows it: { restaurant, items, total }
export async function buildCart(userId) {
	const rows = await CartItem.find({ user: userId })
		.sort({ createdAt: 1 })
		.populate({
			path: 'dish',
			populate: { path: 'restaurant', select: 'name' },
		});

	// a restaurant can delete a dish while it sits in someone's cart
	const valid = rows.filter((row) => row.dish?.restaurant);
	const stale = rows.filter((row) => !row.dish?.restaurant);
	if (stale.length > 0) {
		await CartItem.deleteMany({
			_id: { $in: stale.map((row) => row._id) },
		});
	}

	const restaurant = valid[0]?.dish.restaurant;
	return {
		restaurant: restaurant
			? { id: restaurant.id, name: restaurant.name }
			: null,
		items: valid.map((row) => ({
			id: row.id,
			quantity: row.quantity,
			dish: {
				id: row.dish.id,
				name: row.dish.name,
				description: row.dish.description,
				price: row.dish.price,
				isVeg: row.dish.isVeg,
			},
		})),
		total: valid.reduce(
			(sum, row) => sum + row.dish.price * row.quantity,
			0,
		),
	};
}

export async function getCart(req, res) {
	res.json(await buildCart(req.user._id));
}

// adds a dish, or raises its quantity if it's already in the cart
export async function addItem(req, res) {
	const dish = await Dish.findById(req.body.dishId);
	if (!dish) {
		throw new HttpError(404, 'Dish not found');
	}

	// like real delivery apps, one order comes from one restaurant
	const cart = await buildCart(req.user._id);
	if (cart.restaurant && cart.restaurant.id !== dish.restaurant.toString()) {
		throw new HttpError(
			409,
			`Your cart has dishes from ${cart.restaurant.name}. Empty your cart to order from another restaurant.`,
		);
	}

	const existing = await CartItem.findOne({
		user: req.user._id,
		dish: dish._id,
	});
	if (existing) {
		existing.quantity = Math.min(
			MAX_QUANTITY,
			existing.quantity + req.body.quantity,
		);
		await existing.save();
	} else {
		await CartItem.create({
			user: req.user._id,
			dish: dish._id,
			quantity: req.body.quantity,
		});
	}

	res.json(await buildCart(req.user._id));
}

export async function updateItem(req, res) {
	const item = await CartItem.findOne({
		_id: req.params.id,
		user: req.user._id,
	});
	if (!item) {
		throw new HttpError(404, 'This item is not in your cart');
	}
	item.quantity = req.body.quantity;
	await item.save();
	res.json(await buildCart(req.user._id));
}

export async function removeItem(req, res) {
	// filtering by user means nobody can touch someone else's cart
	const item = await CartItem.findOneAndDelete({
		_id: req.params.id,
		user: req.user._id,
	});
	if (!item) {
		throw new HttpError(404, 'This item is not in your cart');
	}
	res.json(await buildCart(req.user._id));
}

export async function clearCart(req, res) {
	await CartItem.deleteMany({ user: req.user._id });
	res.json(await buildCart(req.user._id));
}
