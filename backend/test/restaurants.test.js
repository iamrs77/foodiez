import { beforeEach, describe, expect, it } from 'vitest';
import { CartItem } from '../src/models/CartItem.js';
import { Dish } from '../src/models/Dish.js';
import { api, createDish, createRestaurant, signUp } from './helpers.js';

let vendor;
let otherVendor;
let customer;

beforeEach(async () => {
	vendor = await signUp('vendor');
	otherVendor = await signUp('vendor');
	customer = await signUp('customer');
});

describe('restaurants', () => {
	it('can be browsed and searched without logging in', async () => {
		await createRestaurant(vendor, {
			name: 'Napoli Slice',
			cuisine: 'Italian',
		});
		await createRestaurant(vendor, {
			name: 'Wok Express',
			cuisine: 'Chinese',
		});

		const all = await api.get('/api/restaurants').expect(200);
		expect(all.body).toHaveLength(2);

		const search = await api
			.get('/api/restaurants?search=ITAL')
			.expect(200);
		expect(search.body.map((r) => r.name)).toEqual(['Napoli Slice']);

		// regex characters in the search are treated as plain text
		await api.get('/api/restaurants?search=(').expect(200);
	});

	it('can only be created by vendors', async () => {
		const body = {
			name: 'Spice Route',
			cuisine: 'North Indian',
			location: 'HSR Layout',
			priceForTwo: 600,
			deliveryTimeMinutes: 30,
		};
		await api.post('/api/restaurants').send(body).expect(401);
		await api
			.post('/api/restaurants')
			.set(customer.auth)
			.send(body)
			.expect(403);

		const res = await api
			.post('/api/restaurants')
			.set(vendor.auth)
			.send(body)
			.expect(201);
		expect(res.body).toMatchObject({ ...body, owner: vendor.user.id });
	});

	it('lists only your own restaurants on /mine', async () => {
		await createRestaurant(vendor, { name: 'Mine' });
		await createRestaurant(otherVendor, { name: 'Not mine' });

		const res = await api
			.get('/api/restaurants/mine')
			.set(vendor.auth)
			.expect(200);
		expect(res.body.map((r) => r.name)).toEqual(['Mine']);
	});

	it('changes only the fields that are sent', async () => {
		const restaurant = await createRestaurant(vendor, { name: 'Old name' });

		const res = await api
			.patch(`/api/restaurants/${restaurant.id}`)
			.set(vendor.auth)
			.send({ name: 'New name' })
			.expect(200);
		expect(res.body).toMatchObject({
			name: 'New name',
			cuisine: restaurant.cuisine,
			priceForTwo: restaurant.priceForTwo,
		});
	});

	it("can't be changed or deleted by another vendor", async () => {
		const restaurant = await createRestaurant(vendor);

		await api
			.patch(`/api/restaurants/${restaurant.id}`)
			.set(otherVendor.auth)
			.send({ name: 'Taken over' })
			.expect(403);
		await api
			.delete(`/api/restaurants/${restaurant.id}`)
			.set(otherVendor.auth)
			.expect(403);

		const res = await api
			.get(`/api/restaurants/${restaurant.id}`)
			.expect(200);
		expect(res.body.name).toBe(restaurant.name);
	});

	it('answers bad and unknown ids clearly', async () => {
		await api.get('/api/restaurants/not-an-id').expect(400);
		await api.get('/api/restaurants/65f000000000000000000000').expect(404);
	});

	it('takes its dishes and cart entries with it when deleted', async () => {
		const restaurant = await createRestaurant(vendor);
		const dish = await createDish(vendor, restaurant.id);
		await api
			.post('/api/cart/items')
			.set(customer.auth)
			.send({ dishId: dish.id })
			.expect(200);

		await api
			.delete(`/api/restaurants/${restaurant.id}`)
			.set(vendor.auth)
			.expect(204);

		expect(await Dish.countDocuments()).toBe(0);
		expect(await CartItem.countDocuments()).toBe(0);
	});
});

describe('dishes', () => {
	let restaurant;

	beforeEach(async () => {
		restaurant = await createRestaurant(vendor);
	});

	it('are listed on the public menu', async () => {
		await createDish(vendor, restaurant.id, { name: 'Masala Dosa' });
		const res = await api
			.get(`/api/restaurants/${restaurant.id}/dishes`)
			.expect(200);
		expect(res.body.map((d) => d.name)).toEqual(['Masala Dosa']);
	});

	it('can only be added by the restaurant owner', async () => {
		const body = { name: 'Idli', price: 80 };
		await api
			.post(`/api/restaurants/${restaurant.id}/dishes`)
			.set(otherVendor.auth)
			.send(body)
			.expect(403);

		const res = await api
			.post(`/api/restaurants/${restaurant.id}/dishes`)
			.set(vendor.auth)
			.send(body)
			.expect(201);
		expect(res.body).toMatchObject({
			...body,
			isVeg: true,
			description: '',
		});
	});

	it('must have unique names within a restaurant', async () => {
		await createDish(vendor, restaurant.id, { name: 'Idli' });
		const res = await api
			.post(`/api/restaurants/${restaurant.id}/dishes`)
			.set(vendor.auth)
			.send({ name: 'Idli', price: 80 })
			.expect(409);
		expect(res.body.message).toMatch(/already has a dish/);
	});

	it('keep a price of 0 and the fields that are not sent', async () => {
		const dish = await createDish(vendor, restaurant.id, {
			name: 'Water',
			description: 'Still water',
		});

		const res = await api
			.patch(`/api/dishes/${dish.id}`)
			.set(vendor.auth)
			.send({ price: 0 })
			.expect(200);
		expect(res.body).toMatchObject({
			name: 'Water',
			description: 'Still water',
			price: 0,
		});
	});

	it("can't be changed or deleted by another vendor", async () => {
		const dish = await createDish(vendor, restaurant.id);

		await api
			.patch(`/api/dishes/${dish.id}`)
			.set(otherVendor.auth)
			.send({ price: 1 })
			.expect(403);
		await api
			.delete(`/api/dishes/${dish.id}`)
			.set(otherVendor.auth)
			.expect(403);

		expect((await Dish.findById(dish.id)).price).toBe(dish.price);
	});

	it('disappear from carts when deleted', async () => {
		const dish = await createDish(vendor, restaurant.id);
		await api
			.post('/api/cart/items')
			.set(customer.auth)
			.send({ dishId: dish.id })
			.expect(200);

		await api.delete(`/api/dishes/${dish.id}`).set(vendor.auth).expect(204);

		const cart = await api.get('/api/cart').set(customer.auth).expect(200);
		expect(cart.body.items).toEqual([]);
	});
});
