import { beforeEach, describe, expect, it } from 'vitest';
import { Order } from '../src/models/Order.js';
import { Restaurant } from '../src/models/Restaurant.js';
import {
	api,
	createDish,
	createRestaurant,
	placeOrder,
	signUp,
} from './helpers.js';

let vendor;
let customer;

beforeEach(async () => {
	vendor = await signUp('vendor');
	customer = await signUp('customer');
});

const names = (res) => res.body.map((r) => r.name);
const search = (query) => api.get('/api/restaurants').query(query).expect(200);

describe('menus', () => {
	it('give dishes a menu section, availability and an optional photo', async () => {
		const restaurant = await createRestaurant(vendor);
		const plain = await createDish(vendor, restaurant.id);
		expect(plain).toMatchObject({
			category: 'Menu',
			available: true,
			image: '',
		});

		const full = await createDish(vendor, restaurant.id, {
			category: 'Starters',
			image: 'https://images.example.com/samosa.jpg',
		});
		expect(full).toMatchObject({
			category: 'Starters',
			image: 'https://images.example.com/samosa.jpg',
		});
	});

	it('only accept https photo links', async () => {
		const restaurant = await createRestaurant(vendor);
		for (const image of [
			'http://images.example.com/a.jpg',
			'javascript:alert(1)',
			'not a link',
		]) {
			const res = await api
				.post(`/api/restaurants/${restaurant.id}/dishes`)
				.set(vendor.auth)
				.send({ name: 'Samosa', price: 40, image })
				.expect(400);
			expect(res.body.errors[0].field).toBe('image');
		}
	});

	it("keep the app's own demo photos when a demo restaurant is edited", async () => {
		const restaurant = await createRestaurant(vendor, {
			image: '/images/restaurants/spice-route.webp',
		});
		await api
			.patch(`/api/restaurants/${restaurant.id}`)
			.set(vendor.auth)
			.send({ name: 'Renamed', image: restaurant.image })
			.expect(200);

		for (const image of ['/etc/passwd', '/images/../secret.webp']) {
			await api
				.patch(`/api/restaurants/${restaurant.id}`)
				.set(vendor.auth)
				.send({ image })
				.expect(400);
		}
	});
});

describe('sold out dishes', () => {
	let restaurant;
	let dosa;

	beforeEach(async () => {
		restaurant = await createRestaurant(vendor);
		dosa = await createDish(vendor, restaurant.id, { name: 'Masala Dosa' });
	});

	const markSoldOut = () =>
		api
			.patch(`/api/dishes/${dosa.id}`)
			.set(vendor.auth)
			.send({ available: false })
			.expect(200);

	it("can't be added to a cart", async () => {
		await markSoldOut();
		const res = await api
			.post('/api/cart/items')
			.set(customer.auth)
			.send({ dishId: dosa.id })
			.expect(409);
		expect(res.body.message).toBe('Masala Dosa is sold out right now');
	});

	it('stop an order if they sold out after going in the cart', async () => {
		await api
			.post('/api/cart/items')
			.set(customer.auth)
			.send({ dishId: dosa.id })
			.expect(200);
		await markSoldOut();

		const cart = await api.get('/api/cart').set(customer.auth);
		expect(cart.body.items[0].dish.available).toBe(false);
		const res = await placeOrder(customer).expect(409);
		expect(res.body.message).toBe(
			'Sold out since you added it: Masala Dosa. Remove it from your cart to order.',
		);
		expect(await Order.countDocuments()).toBe(0);
	});
});

describe('finding restaurants', () => {
	beforeEach(async () => {
		const napoli = await createRestaurant(vendor, {
			name: 'Napoli Slice',
			cuisine: 'Italian, Pizza',
			location: 'Indiranagar, Bengaluru',
			priceForTwo: 800,
			deliveryTimeMinutes: 35,
		});
		await createDish(vendor, napoli.id, { isVeg: true });
		await createDish(vendor, napoli.id, { isVeg: false });

		const dosa = await createRestaurant(vendor, {
			name: 'Dosa Corner',
			cuisine: 'South Indian',
			location: 'Jayanagar, Bengaluru',
			priceForTwo: 300,
			deliveryTimeMinutes: 20,
		});
		await createDish(vendor, dosa.id, { isVeg: true });

		await createRestaurant(vendor, {
			name: 'Spice Route',
			cuisine: 'North Indian',
			location: 'HSR Layout, Bengaluru',
			priceForTwo: 600,
			deliveryTimeMinutes: 30,
		});
	});

	it('match the start of any word of the name, cuisine or area', async () => {
		expect(names(await search({ search: 'piz' }))).toEqual([
			'Napoli Slice',
		]);
		expect(names(await search({ search: 'north ind' }))).toEqual([
			'Spice Route',
		]);
		expect(names(await search({ search: 'JAYA' }))).toEqual([
			'Dosa Corner',
		]);
		expect(names(await search({ search: 'indian' })).sort()).toEqual([
			'Dosa Corner',
			'Spice Route',
		]);
		// the middle of a word doesn't match: that's what lets search use an index
		expect(names(await search({ search: 'izza' }))).toEqual([]);
	});

	it('search with an index, not by reading every restaurant', async () => {
		const plan = await Restaurant.find({
			sandbox: null,
			$and: [{ searchTerms: { $regex: '^piz' } }],
		}).explain('queryPlanner');
		const winning = JSON.stringify(plan.queryPlanner.winningPlan);
		expect(winning).toContain('IXSCAN');
		expect(winning).toContain('searchTerms');
		expect(winning).not.toContain('COLLSCAN');
	});

	it('keep search words up to date when a restaurant changes', async () => {
		const [spice] = (await search({ search: 'spice' })).body;
		await api
			.patch(`/api/restaurants/${spice.id}`)
			.set(vendor.auth)
			.send({ name: 'Tandoor House' })
			.expect(200);

		expect(names(await search({ search: 'tandoor' }))).toEqual([
			'Tandoor House',
		]);
		expect(names(await search({ search: 'spice' }))).toEqual([]);
		expect(spice).not.toHaveProperty('searchTerms');
	});

	it('add search words to restaurants saved before they existed', async () => {
		await Restaurant.collection.insertOne({
			name: 'Old Biryani House',
			cuisine: 'Hyderabadi',
			location: 'Old Airport Road',
			priceForTwo: 400,
			deliveryTimeMinutes: 40,
			owner: vendor.user.id,
			sandbox: null,
			createdAt: new Date(),
		});
		expect(names(await search({ search: 'biryani' }))).toEqual([]);

		expect(await Restaurant.addMissingSearchTerms()).toBe(1);
		expect(names(await search({ search: 'biryani' }))).toEqual([
			'Old Biryani House',
		]);
	});

	it('filter by cuisine, matching whole cuisines only', async () => {
		expect(names(await search({ cuisine: 'pizza' }))).toEqual([
			'Napoli Slice',
		]);
		expect(names(await search({ cuisine: 'Indian' }))).toEqual([]);
		expect(names(await search({ cuisine: 'South Indian' }))).toEqual([
			'Dosa Corner',
		]);
	});

	it('mark and filter pure veg restaurants (all dishes veg)', async () => {
		const all = await search({});
		const pureVeg = Object.fromEntries(
			all.body.map((r) => [r.name, r.pureVeg]),
		);
		// Spice Route has no dishes yet, so it isn't called pure veg
		expect(pureVeg).toEqual({
			'Napoli Slice': false,
			'Dosa Corner': true,
			'Spice Route': false,
		});
		expect(names(await search({ veg: 'true' }))).toEqual(['Dosa Corner']);
	});

	it('sort by delivery time or price, and ignore unknown sorts', async () => {
		expect(names(await search({ sort: 'fastest' }))).toEqual([
			'Dosa Corner',
			'Spice Route',
			'Napoli Slice',
		]);
		expect(names(await search({ sort: 'cheapest' }))).toEqual([
			'Dosa Corner',
			'Spice Route',
			'Napoli Slice',
		]);
		// newest first
		expect(names(await search({ sort: 'constructor' }))).toEqual([
			'Spice Route',
			'Dosa Corner',
			'Napoli Slice',
		]);
	});

	it('list the cuisines to filter by, most common first', async () => {
		const res = await api.get('/api/restaurants/cuisines').expect(200);
		expect(res.body).toEqual([
			'Italian',
			'North Indian',
			'Pizza',
			'South Indian',
		]);
	});
});
