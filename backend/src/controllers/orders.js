import { HttpError } from '../middleware/errors.js';
import { CartItem } from '../models/CartItem.js';
import { Order } from '../models/Order.js';
import { buildCart } from './cart.js';

// turns the cart into an order, then empties the cart
export async function placeOrder(req, res) {
	const cart = await buildCart(req.user._id);
	if (cart.items.length === 0) {
		throw new HttpError(400, 'Your cart is empty');
	}

	// prices and the total come from the database, never from the browser
	const order = await Order.create({
		user: req.user._id,
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
	});
	await CartItem.deleteMany({ user: req.user._id });

	res.status(201).json(order);
}

export async function listOrders(req, res) {
	res.json(
		await Order.find({ user: req.user._id })
			.sort({ createdAt: -1, _id: -1 })
			.limit(50),
	);
}
