import { CartItem } from '../models/CartItem.js';
import { Dish } from '../models/Dish.js';
import { Order } from '../models/Order.js';
import { Restaurant } from '../models/Restaurant.js';
import { Sandbox } from '../models/Sandbox.js';
import { User } from '../models/User.js';
import {
	DEMO_PASSWORD,
	demoOrders,
	demoRestaurants,
	demoUsers,
} from './demoData.js';

const MINUTE = 60 * 1000;

// minutes after placing an order that it reached each status, for demo orders
const TIMELINE = [
	['placed', 0],
	['accepted', 3],
	['preparing', 6],
	['out_for_delivery', 25],
	['delivered', 45],
];

// the status changes of a demo order that has got as far as `status`
function statusTimeline(status, placedAt) {
	const reached = TIMELINE.slice(
		0,
		TIMELINE.findIndex(([s]) => s === status) + 1,
	);
	return reached.map(([s, minutes]) => ({
		status: s,
		at: new Date(placedAt.getTime() + minutes * MINUTE),
	}));
}

// a demo account's email inside a sandbox, e.g. vendor+<sandbox id>@foodiez.dev,
// so every visitor's copy of the account has its own unique email
export function sandboxEmail(email, sandboxId) {
	const [name, domain] = email.split('@');
	return `${name}+${sandboxId}@${domain}`;
}

/**
 * Adds the demo accounts, restaurants, dishes and past orders. Without a sandbox
 * they're the showcase everyone sees. With one, they're a visitor's private copy:
 * every document belongs to the sandbox and expires with it.
 */
export async function loadDemoData({ passwordHash, sandbox = null }) {
	const stamp = sandbox
		? { sandbox: sandbox._id, expiresAt: sandbox.expiresAt }
		: {};

	const users = await User.insertMany(
		demoUsers.map((user) => ({
			...user,
			email: sandbox ? sandboxEmail(user.email, sandbox.id) : user.email,
			passwordHash,
			...stamp,
		})),
	);
	const userByDemoEmail = new Map(
		users.map((user, i) => [demoUsers[i].email, user]),
	);

	const restaurantByName = new Map();
	// inserted in reverse so the list (newest first) shows them in the order above
	for (const { ownerEmail, dishes, ...data } of [
		...demoRestaurants,
	].reverse()) {
		const restaurant = await Restaurant.create({
			...data,
			owner: userByDemoEmail.get(ownerEmail)._id,
			...stamp,
		});
		const savedDishes = await Dish.insertMany(
			dishes.map((dish) => ({
				...dish,
				restaurant: restaurant._id,
				...stamp,
			})),
		);
		restaurantByName.set(restaurant.name, {
			restaurant,
			dishes: savedDishes,
		});
	}

	for (const order of demoOrders) {
		const { restaurant, dishes } = restaurantByName.get(
			order.restaurantName,
		);
		const customer = userByDemoEmail.get(order.customerEmail);
		const orderItems = order.items.map(({ name, quantity }) => {
			const dish = dishes.find((d) => d.name === name);
			return {
				dish: dish._id,
				name: dish.name,
				price: dish.price,
				isVeg: dish.isVeg,
				quantity,
			};
		});
		const placedAt = new Date(Date.now() - order.minutesAgo * MINUTE);
		const statusHistory = statusTimeline(order.status, placedAt);
		const saved = await Order.create({
			user: customer._id,
			customerName: `${customer.firstName} ${customer.lastName}`,
			restaurant: restaurant._id,
			restaurantName: restaurant.name,
			items: orderItems,
			total: orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
			delivery: order.delivery,
			status: order.status,
			statusHistory,
			...stamp,
		});

		// timestamps can't be set through Mongoose, so date the order in the past directly
		await Order.collection.updateOne(
			{ _id: saved._id },
			{
				$set: {
					createdAt: placedAt,
					updatedAt: statusHistory.at(-1).at,
				},
			},
		);
	}

	return users;
}

// deletes everything, including any visitors' demos, and loads the demo data
export async function seedDemoData() {
	await Promise.all(
		[User, Restaurant, Dish, CartItem, Order, Sandbox].map((model) =>
			model.deleteMany({}),
		),
	);

	const users = await loadDemoData({
		passwordHash: await User.hashPassword(DEMO_PASSWORD),
	});

	return {
		users: users.length,
		restaurants: demoRestaurants.length,
		orders: demoOrders.length,
	};
}

// used on startup when SEED_DEMO_DATA=true: only fills an empty database
export async function seedIfEmpty() {
	if ((await User.estimatedDocumentCount()) > 0) {
		return false;
	}
	await seedDemoData();
	return true;
}
