import { beforeEach, describe, expect, it } from 'vitest';
import { api, createDish, createRestaurant, signUp } from './helpers.js';

let vendor;
let customer;
let restaurant;
let dosa;
let coffee;

beforeEach(async () => {
	vendor = await signUp('vendor');
	customer = await signUp('customer');
	restaurant = await createRestaurant(vendor, { name: 'Dosa Corner' });
	dosa = await createDish(vendor, restaurant.id, {
		name: 'Masala Dosa',
		price: 120,
	});
	coffee = await createDish(vendor, restaurant.id, {
		name: 'Filter Coffee',
		price: 40,
	});
});

const addToCart = (user, dishId, quantity) =>
	api.post('/api/cart/items').set(user.auth).send({ dishId, quantity });

describe('cart', () => {
	it('is only for customers', async () => {
		await api.get('/api/cart').expect(401);
		await api.get('/api/cart').set(vendor.auth).expect(403);
	});

	it('adds dishes, raises the quantity on repeat adds and works out the total', async () => {
		await addToCart(customer, dosa.id).expect(200);
		await addToCart(customer, dosa.id, 2).expect(200);
		const res = await addToCart(customer, coffee.id).expect(200);

		expect(res.body.restaurant).toEqual({
			id: restaurant.id,
			name: 'Dosa Corner',
		});
		expect(res.body.items.map((i) => [i.dish.name, i.quantity])).toEqual([
			['Masala Dosa', 3],
			['Filter Coffee', 1],
		]);
		expect(res.body.total).toBe(3 * 120 + 40);
	});

	it('caps the quantity at 20', async () => {
		await addToCart(customer, dosa.id, 15).expect(200);
		const res = await addToCart(customer, dosa.id, 15).expect(200);
		expect(res.body.items[0].quantity).toBe(20);
		await addToCart(customer, dosa.id, 21).expect(400);
	});

	it('holds dishes from one restaurant at a time', async () => {
		const other = await createRestaurant(vendor, { name: 'Burger Barn' });
		const burger = await createDish(vendor, other.id);

		await addToCart(customer, dosa.id).expect(200);
		const conflict = await addToCart(customer, burger.id).expect(409);
		expect(conflict.body.message).toMatch(/Dosa Corner/);

		await api.delete('/api/cart').set(customer.auth).expect(200);
		await addToCart(customer, burger.id).expect(200);
	});

	it("can't be changed by another customer", async () => {
		const cart = await addToCart(customer, dosa.id).expect(200);
		const itemId = cart.body.items[0].id;
		const stranger = await signUp('customer');

		await api
			.patch(`/api/cart/items/${itemId}`)
			.set(stranger.auth)
			.send({ quantity: 5 })
			.expect(404);
		await api
			.delete(`/api/cart/items/${itemId}`)
			.set(stranger.auth)
			.expect(404);

		const mine = await api.get('/api/cart').set(customer.auth).expect(200);
		expect(mine.body.items).toHaveLength(1);
		expect(mine.body.items[0].quantity).toBe(1);
	});

	it('updates and removes items', async () => {
		const cart = await addToCart(customer, dosa.id).expect(200);
		const itemId = cart.body.items[0].id;

		const updated = await api
			.patch(`/api/cart/items/${itemId}`)
			.set(customer.auth)
			.send({ quantity: 4 })
			.expect(200);
		expect(updated.body.total).toBe(480);

		const removed = await api
			.delete(`/api/cart/items/${itemId}`)
			.set(customer.auth)
			.expect(200);
		expect(removed.body).toEqual({ restaurant: null, items: [], total: 0 });
	});
});

describe('orders', () => {
	it('turns the cart into an order and empties the cart', async () => {
		await addToCart(customer, dosa.id, 2).expect(200);
		await addToCart(customer, coffee.id).expect(200);

		const res = await api
			.post('/api/orders')
			.set(customer.auth)
			.expect(201);
		expect(res.body).toMatchObject({
			restaurantName: 'Dosa Corner',
			total: 280,
			items: [
				{ name: 'Masala Dosa', price: 120, quantity: 2 },
				{ name: 'Filter Coffee', price: 40, quantity: 1 },
			],
		});

		const cart = await api.get('/api/cart').set(customer.auth).expect(200);
		expect(cart.body.items).toEqual([]);
	});

	it('refuses an empty cart', async () => {
		const res = await api
			.post('/api/orders')
			.set(customer.auth)
			.expect(400);
		expect(res.body.message).toBe('Your cart is empty');
	});

	it('keep the price that was paid when the menu changes later', async () => {
		await addToCart(customer, dosa.id).expect(200);
		await api.post('/api/orders').set(customer.auth).expect(201);

		await api
			.patch(`/api/dishes/${dosa.id}`)
			.set(vendor.auth)
			.send({ price: 999 })
			.expect(200);

		const history = await api
			.get('/api/orders')
			.set(customer.auth)
			.expect(200);
		expect(history.body[0].items[0].price).toBe(120);
		expect(history.body[0].total).toBe(120);
	});

	it('show only your own orders, newest first', async () => {
		const stranger = await signUp('customer');
		await addToCart(stranger, dosa.id).expect(200);
		await api.post('/api/orders').set(stranger.auth).expect(201);

		await addToCart(customer, dosa.id).expect(200);
		await api.post('/api/orders').set(customer.auth).expect(201);
		await addToCart(customer, coffee.id).expect(200);
		await api.post('/api/orders').set(customer.auth).expect(201);

		const history = await api
			.get('/api/orders')
			.set(customer.auth)
			.expect(200);
		expect(history.body.map((o) => o.total)).toEqual([40, 120]);
	});
});
