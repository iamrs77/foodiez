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

const DAY = 24 * 60 * 60 * 1000;

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

	const customer = users.find((user) => user.role === 'customer');
	for (const { restaurantName, daysAgo, items } of demoOrders) {
		const { restaurant, dishes } = restaurantByName.get(restaurantName);
		const orderItems = items.map(({ name, quantity }) => {
			const dish = dishes.find((d) => d.name === name);
			return {
				dish: dish._id,
				name: dish.name,
				price: dish.price,
				isVeg: dish.isVeg,
				quantity,
			};
		});
		const order = await Order.create({
			user: customer._id,
			restaurant: restaurant._id,
			restaurantName: restaurant.name,
			items: orderItems,
			total: orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
			...stamp,
		});

		// timestamps can't be set through Mongoose, so date the order in the past directly
		const placedAt = new Date(Date.now() - daysAgo * DAY);
		await Order.collection.updateOne(
			{ _id: order._id },
			{ $set: { createdAt: placedAt, updatedAt: placedAt } },
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
