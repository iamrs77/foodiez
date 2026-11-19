import { beforeEach, describe, expect, it } from 'vitest';
import { Order } from '../src/models/Order.js';
import {
	api,
	createDish,
	createRestaurant,
	DELIVERY,
	placeOrder,
	signUp,
} from './helpers.js';

let vendor;
let customer;
let restaurant;
let dosa;

beforeEach(async () => {
	vendor = await signUp('vendor');
	customer = await signUp('customer', { firstName: 'Priya' });
	restaurant = await createRestaurant(vendor, { name: 'Dosa Corner' });
	dosa = await createDish(vendor, restaurant.id, {
		name: 'Masala Dosa',
		price: 120,
	});
});

const addToCart = (user, dishId = dosa.id, quantity = 1) =>
	api
		.post('/api/cart/items')
		.set(user.auth)
		.send({ dishId, quantity })
		.expect(200);

const setStatus = (user, order, status) =>
	api.patch(`/api/vendor/orders/${order.id}`).set(user.auth).send({ status });

async function placedOrder(user = customer) {
	await addToCart(user);
	return (await placeOrder(user).expect(201)).body;
}

describe('checkout', () => {
	it('needs a delivery address and phone number', async () => {
		await addToCart(customer);
		const res = await placeOrder(customer, {
			delivery: { address: '', phone: 'call me' },
		}).expect(400);
		expect(res.body.errors.map((e) => e.field).sort()).toEqual([
			'delivery.address',
			'delivery.phone',
		]);
	});

	it('records who ordered, where to deliver, and that the order was placed', async () => {
		const order = await placedOrder();
		expect(order).toMatchObject({
			customerName: expect.stringMatching(/^Priya /),
			restaurantName: 'Dosa Corner',
			delivery: DELIVERY,
			status: 'placed',
			statusHistory: [{ status: 'placed', at: expect.any(String) }],
		});
		expect(order).not.toHaveProperty('idempotencyKey');
	});
});

describe('placing an order safely', () => {
	it('returns the same order when a request is retried with its Idempotency-Key', async () => {
		await addToCart(customer);
		const first = await placeOrder(customer, {
			key: 'checkout-1234',
		}).expect(201);
		const retry = await placeOrder(customer, {
			key: 'checkout-1234',
		}).expect(200);

		expect(retry.body.id).toBe(first.body.id);
		expect(await Order.countDocuments()).toBe(1);
	});

	it('places one order when the same request arrives twice at once', async () => {
		await addToCart(customer);
		const responses = await Promise.all(
			[1, 2, 3].map(() =>
				placeOrder(customer, { key: 'double-click-1' }),
			),
		);

		expect(new Set(responses.map((r) => r.body.id)).size).toBe(1);
		expect(responses.every((r) => [200, 201].includes(r.status))).toBe(
			true,
		);
		expect(await Order.countDocuments()).toBe(1);
	});

	it('places the cart once when two tabs order it at the same moment', async () => {
		await addToCart(customer, dosa.id, 2);
		const responses = await Promise.all(
			['tab-one-1', 'tab-two-2', 'tab-three-3'].map((key) =>
				placeOrder(customer, { key }),
			),
		);

		const statuses = responses.map((r) => r.status).sort();
		expect(statuses).toEqual([201, 400, 400]);
		const refused = responses.find((r) => r.status === 400);
		expect(refused.body.message).toBe('Your cart is empty');
		expect(await Order.countDocuments()).toBe(1);
	});

	it('rejects a malformed Idempotency-Key', async () => {
		await addToCart(customer);
		await placeOrder(customer, { key: 'no spaces!' }).expect(400);
	});
});

describe('customers tracking orders', () => {
	it('shows one of your orders, and nobody else can see it', async () => {
		const order = await placedOrder();
		const res = await api
			.get(`/api/orders/${order.id}`)
			.set(customer.auth)
			.expect(200);
		expect(res.body.status).toBe('placed');

		const stranger = await signUp('customer');
		await api.get(`/api/orders/${order.id}`).set(stranger.auth).expect(404);
	});

	it('can cancel until the restaurant accepts', async () => {
		const first = await placedOrder();
		const cancelled = await api
			.post(`/api/orders/${first.id}/cancel`)
			.set(customer.auth)
			.expect(200);
		expect(cancelled.body.status).toBe('cancelled');

		const second = await placedOrder();
		await setStatus(vendor, second, 'accepted').expect(200);
		const res = await api
			.post(`/api/orders/${second.id}/cancel`)
			.set(customer.auth)
			.expect(409);
		expect(res.body.message).toBe(
			"This order is already accepted, so it can't be cancelled",
		);
	});
});

describe('restaurants handling orders', () => {
	it('lists the orders for their own restaurants, oldest first', async () => {
		const first = await placedOrder();
		const other = await signUp('customer');
		const second = await placedOrder(other);

		const rival = await signUp('vendor');
		const rivalRestaurant = await createRestaurant(rival);
		const rivalDish = await createDish(rival, rivalRestaurant.id);
		await addToCart(other, rivalDish.id);
		await placeOrder(other).expect(201);

		const active = await api
			.get('/api/vendor/orders')
			.set(vendor.auth)
			.expect(200);
		expect(active.body.map((o) => o.id)).toEqual([first.id, second.id]);
		expect(active.body[0].delivery).toEqual(DELIVERY);
	});

	it('moves an order through each step, recording when', async () => {
		const order = await placedOrder();
		for (const status of [
			'accepted',
			'preparing',
			'out_for_delivery',
			'delivered',
		]) {
			await setStatus(vendor, order, status).expect(200);
		}

		const res = await api
			.get(`/api/orders/${order.id}`)
			.set(customer.auth)
			.expect(200);
		expect(res.body.status).toBe('delivered');
		expect(res.body.statusHistory.map((s) => s.status)).toEqual([
			'placed',
			'accepted',
			'preparing',
			'out_for_delivery',
			'delivered',
		]);

		// finished orders move to the past list
		const active = await api.get('/api/vendor/orders').set(vendor.auth);
		expect(active.body).toEqual([]);
		const past = await api
			.get('/api/vendor/orders?view=past')
			.set(vendor.auth);
		expect(past.body.map((o) => o.id)).toEqual([order.id]);
	});

	it("can't skip steps or change a finished order", async () => {
		const order = await placedOrder();
		const skip = await setStatus(vendor, order, 'delivered').expect(409);
		expect(skip.body.message).toBe(
			"This order is placed, so it can't be marked delivered",
		);

		await setStatus(vendor, order, 'cancelled').expect(200);
		await setStatus(vendor, order, 'accepted').expect(409);
	});

	it("can't see or change other restaurants' orders", async () => {
		const order = await placedOrder();
		const rival = await signUp('vendor');
		await setStatus(rival, order, 'accepted').expect(404);
		const list = await api.get('/api/vendor/orders').set(rival.auth);
		expect(list.body).toEqual([]);

		// and the two sides can't use each other's endpoints
		await api.get('/api/vendor/orders').set(customer.auth).expect(403);
		await api.get(`/api/orders/${order.id}`).set(vendor.auth).expect(403);
	});

	it('lets exactly one change win when two happen at once', async () => {
		const order = await placedOrder();
		const [accept, cancel] = await Promise.all([
			setStatus(vendor, order, 'accepted'),
			api.post(`/api/orders/${order.id}/cancel`).set(customer.auth),
		]);
		expect([accept.status, cancel.status].sort()).toEqual([200, 409]);

		const final = await Order.findById(order.id);
		expect(final.statusHistory).toHaveLength(2);
		expect(final.status).toBe(
			accept.status === 200 ? 'accepted' : 'cancelled',
		);

		const second = await placedOrder();
		const clicks = await Promise.all([
			setStatus(vendor, second, 'accepted'),
			setStatus(vendor, second, 'accepted'),
		]);
		expect(clicks.map((r) => r.status).sort()).toEqual([200, 409]);
	});
});

describe('orders in demos', () => {
	it('gives the demo restaurant owner a new order to accept, and keeps demos apart', async () => {
		const first = await api
			.post('/api/demo')
			.send({ as: 'vendor' })
			.expect(201);
		const second = await api
			.post('/api/demo')
			.send({ as: 'vendor' })
			.expect(201);
		const auth = (demo) => ({ Authorization: `Bearer ${demo.body.token}` });

		const incoming = await api
			.get('/api/vendor/orders')
			.set(auth(first))
			.expect(200);
		expect(incoming.body).toHaveLength(1);
		expect(incoming.body[0]).toMatchObject({
			customerName: 'Rahul Verma',
			restaurantName: 'Napoli Slice',
			status: 'placed',
		});

		// the other demo's owner can't touch it
		await setStatus(
			{ auth: auth(second) },
			incoming.body[0],
			'accepted',
		).expect(404);
		await setStatus(
			{ auth: auth(first) },
			incoming.body[0],
			'accepted',
		).expect(200);
	});
});
