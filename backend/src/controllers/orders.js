import { z } from 'zod';
import { inTransaction } from '../db.js';
import { HttpError } from '../middleware/errors.js';
import { CartItem } from '../models/CartItem.js';
import {
	ACTIVE_STATUSES,
	NEXT_STATUSES,
	ORDER_STATUSES,
	Order,
} from '../models/Order.js';
import { Restaurant } from '../models/Restaurant.js';
import { sameSandboxAs } from '../models/Sandbox.js';
import { buildCart } from './cart.js';

export const placeOrderSchema = z.object({
	delivery: z.object({
		address: z
			.string()
			.trim()
			.min(5, 'Enter the delivery address')
			.max(300),
		phone: z
			.string()
			.trim()
			.regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a phone number'),
		note: z.string().trim().max(200).default(''),
	}),
});

export const updateStatusSchema = z.object({
	status: z.enum(ORDER_STATUSES),
});

const STATUS_LABELS = {
	placed: 'placed',
	accepted: 'accepted',
	preparing: 'being prepared',
	out_for_delivery: 'out for delivery',
	delivered: 'delivered',
	cancelled: 'cancelled',
};

const changeTo = (status) => ({
	$set: { status },
	$push: { statusHistory: { status, at: new Date() } },
});

// the Idempotency-Key header, if the client sent one
function idempotencyKey(req) {
	const key = req.get('idempotency-key');
	if (key !== undefined && !/^[\w-]{8,100}$/.test(key)) {
		throw new HttpError(
			400,
			'Idempotency-Key must be 8 to 100 letters, digits, - or _',
		);
	}
	return key;
}

/**
 * POST /api/orders: turns the cart into an order and empties the cart, in one
 * transaction. Two tabs ordering the same cart can't both succeed: the second
 * transaction finds the cart already empty. A retry with the same
 * Idempotency-Key (say, after a timeout) gets the first order back.
 */
export async function placeOrder(req, res) {
	const key = idempotencyKey(req);
	const replay = () =>
		key ? Order.findOne({ user: req.user._id, idempotencyKey: key }) : null;

	const earlier = await replay();
	if (earlier) {
		return res.json(earlier);
	}

	let order;
	try {
		order = await inTransaction(async () => {
			const cart = await buildCart(req.user._id);
			if (cart.items.length === 0) {
				throw new HttpError(400, 'Your cart is empty');
			}

			// prices and the total come from the database, never from the browser
			const [created] = await Order.create([
				{
					user: req.user._id,
					customerName: `${req.user.firstName} ${req.user.lastName}`,
					restaurant: cart.restaurant.id,
					restaurantName: cart.restaurant.name,
					items: cart.items.map(({ dish, quantity }) => ({
						dish: dish.id,
						name: dish.name,
						price: dish.price,
						isVeg: dish.isVeg,
						quantity,
					})),
					total: cart.total,
					delivery: req.body.delivery,
					statusHistory: [{ status: 'placed', at: new Date() }],
					idempotencyKey: key,
					...sameSandboxAs(req.user),
				},
			]);
			await CartItem.deleteMany({ user: req.user._id });
			return created;
		});
	} catch (err) {
		// the same key at the same moment: the other request placed the order
		const other = await replay();
		if (other) {
			return res.json(other);
		}
		throw err;
	}

	res.status(201).json(order);
}

export async function listOrders(req, res) {
	res.json(
		await Order.find({ user: req.user._id })
			.sort({ createdAt: -1, _id: -1 })
			.limit(50),
	);
}

// GET /api/orders/:id: one of the customer's orders, for tracking it
export async function getOrder(req, res) {
	const order = await Order.findOne({
		_id: req.params.id,
		user: req.user._id,
	});
	if (!order) {
		throw new HttpError(404, 'Order not found');
	}
	res.json(order);
}

// POST /api/orders/:id/cancel: customers can cancel until the restaurant accepts
export async function cancelOrder(req, res) {
	// only if it's still "placed": if the restaurant accepts it at the same
	// moment, exactly one of the two changes wins
	const order = await Order.findOneAndUpdate(
		{ _id: req.params.id, user: req.user._id, status: 'placed' },
		changeTo('cancelled'),
		{ returnDocument: 'after' },
	);
	if (order) {
		return res.json(order);
	}

	const existing = await Order.findOne({
		_id: req.params.id,
		user: req.user._id,
	});
	if (!existing) {
		throw new HttpError(404, 'Order not found');
	}
	throw new HttpError(
		409,
		`This order is already ${STATUS_LABELS[existing.status]}, so it can't be cancelled`,
	);
}

// the vendor's restaurants' ids: a vendor sees only orders for their own
const ownRestaurants = (user) =>
	Restaurant.find({ owner: user._id }).distinct('_id');

// GET /api/vendor/orders?view=active|past
export async function listVendorOrders(req, res) {
	const restaurant = { $in: await ownRestaurants(req.user) };
	if (req.query.view === 'past') {
		return res.json(
			await Order.find({
				restaurant,
				status: { $nin: ACTIVE_STATUSES },
			})
				.sort({ updatedAt: -1, _id: -1 })
				.limit(50),
		);
	}
	// orders still to deal with, oldest first, like a kitchen's queue
	res.json(
		await Order.find({ restaurant, status: { $in: ACTIVE_STATUSES } }).sort(
			{ createdAt: 1, _id: 1 },
		),
	);
}

// PATCH /api/vendor/orders/:id { status }: moves an order to its next step
export async function updateOrderStatus(req, res) {
	const order = await Order.findOne({
		_id: req.params.id,
		restaurant: { $in: await ownRestaurants(req.user) },
	});
	if (!order) {
		throw new HttpError(404, 'Order not found');
	}

	const to = req.body.status;
	if (!NEXT_STATUSES[order.status].includes(to)) {
		throw new HttpError(
			409,
			`This order is ${STATUS_LABELS[order.status]}, so it can't be marked ${STATUS_LABELS[to]}`,
		);
	}

	// compare and set: only if nobody changed it since it was read, so two
	// clicks (or a customer cancelling) can't both win
	const updated = await Order.findOneAndUpdate(
		{ _id: order._id, status: order.status },
		changeTo(to),
		{ returnDocument: 'after' },
	);
	if (!updated) {
		throw new HttpError(
			409,
			'This order was just changed by someone else. Refresh to see where it is.',
		);
	}
	res.json(updated);
}
