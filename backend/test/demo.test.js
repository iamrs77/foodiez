import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { CartItem } from '../src/models/CartItem.js';
import { Dish } from '../src/models/Dish.js';
import { Order } from '../src/models/Order.js';
import { Restaurant } from '../src/models/Restaurant.js';
import { Sandbox } from '../src/models/Sandbox.js';
import { User } from '../src/models/User.js';
import { seedDemoData } from '../src/seed/seed.js';
import {
	api,
	createDish,
	createRestaurant,
	placeOrder,
	signUp,
} from './helpers.js';

const HOUR = 60 * 60 * 1000;

// starts a demo and returns { user, token, auth } like signUp does
async function startDemo(as = 'customer') {
	const res = await api.post('/api/demo').send({ as }).expect(201);
	return {
		user: res.body.user,
		token: res.body.token,
		auth: { Authorization: `Bearer ${res.body.token}` },
	};
}

const restaurantNames = async (auth) => {
	const req = api.get('/api/restaurants');
	const res = await (auth ? req.set(auth) : req).expect(200);
	return res.body.map((r) => r.name).sort();
};

// settings changed by a test are put back afterwards
const original = { ...config };
afterEach(() => Object.assign(config, original));

describe('try the demo', () => {
	let realVendor;

	beforeEach(async () => {
		realVendor = await signUp('vendor');
		await createRestaurant(realVendor, { name: 'Real Place' });
	});

	it('gives the visitor a private copy of the demo data, for 24 hours', async () => {
		const before = Date.now();
		const demo = await startDemo('customer');

		expect(demo.user.role).toBe('customer');
		expect(demo.user.firstName).toBe('Priya');
		expect(demo.user).not.toHaveProperty('sandbox');
		const expiresAt = new Date(demo.user.expiresAt).getTime();
		expect(expiresAt).toBeGreaterThanOrEqual(before + 24 * HOUR);
		expect(expiresAt).toBeLessThan(Date.now() + 24 * HOUR + 1000);

		// the demo's own five restaurants, and none of the real ones
		expect(await restaurantNames(demo.auth)).toEqual([
			'Burger Barn',
			'Dosa Corner',
			'Napoli Slice',
			'Spice Route',
			'Wok Express',
		]);
		// logged-out visitors don't see any demo's restaurants
		expect(await restaurantNames()).toEqual(['Real Place']);

		const orders = await api.get('/api/orders').set(demo.auth).expect(200);
		expect(orders.body).toHaveLength(2);
	});

	it("keeps each visitor's changes to their own demo", async () => {
		const first = await startDemo('vendor');
		const second = await startDemo('vendor');

		const [spiceRoute] = (
			await api.get('/api/restaurants/mine').set(first.auth).expect(200)
		).body.filter((r) => r.name === 'Spice Route');
		await api
			.patch(`/api/restaurants/${spiceRoute.id}`)
			.set(first.auth)
			.send({ name: 'Renamed by visitor one' })
			.expect(200);

		expect(await restaurantNames(first.auth)).toContain(
			'Renamed by visitor one',
		);
		expect(await restaurantNames(second.auth)).toContain('Spice Route');
		expect(await restaurantNames(second.auth)).not.toContain(
			'Renamed by visitor one',
		);
		expect(await restaurantNames()).toEqual(['Real Place']);

		// nor can a demo reach another demo's restaurant by its id
		await api
			.get(`/api/restaurants/${spiceRoute.id}`)
			.set(second.auth)
			.expect(404);
		await api
			.patch(`/api/restaurants/${spiceRoute.id}`)
			.set(second.auth)
			.send({ name: 'Hijacked' })
			.expect(403);
	});

	it('lets a demo customer order only from their own demo', async () => {
		const demo = await startDemo('customer');
		const realRestaurant = (await api.get('/api/restaurants').expect(200))
			.body[0];
		const realDish = await createDish(realVendor, realRestaurant.id);

		await api
			.post('/api/cart/items')
			.set(demo.auth)
			.send({ dishId: realDish.id })
			.expect(404);

		const [dosaCorner] = (
			await api.get('/api/restaurants').set(demo.auth)
		).body.filter((r) => r.name === 'Dosa Corner');
		const dishes = await api
			.get(`/api/restaurants/${dosaCorner.id}/dishes`)
			.set(demo.auth)
			.expect(200);
		await api
			.post('/api/cart/items')
			.set(demo.auth)
			.send({ dishId: dishes.body[0].id, quantity: 2 })
			.expect(200);
		await placeOrder(demo).expect(201);

		const orders = await api.get('/api/orders').set(demo.auth).expect(200);
		expect(orders.body).toHaveLength(3);
		expect(orders.body[0].restaurantName).toBe('Dosa Corner');
	});

	it('switches between the vendor and the customer of the same demo', async () => {
		const vendor = await startDemo('vendor');
		expect(vendor.user.firstName).toBe('Asha');
		const mine = await api
			.get('/api/restaurants/mine')
			.set(vendor.auth)
			.expect(200);
		expect(mine.body.map((r) => r.name).sort()).toEqual([
			'Dosa Corner',
			'Napoli Slice',
			'Spice Route',
		]);

		// the vendor adds a dish, and their demo's customer can see it
		const spiceRoute = mine.body.find((r) => r.name === 'Spice Route');
		await createDish(vendor, spiceRoute.id, { name: 'Demo Special' });

		const switched = await api
			.post('/api/demo/switch')
			.set(vendor.auth)
			.expect(200);
		expect(switched.body.user.role).toBe('customer');
		const customerAuth = {
			Authorization: `Bearer ${switched.body.token}`,
		};
		const dishes = await api
			.get(`/api/restaurants/${spiceRoute.id}/dishes`)
			.set(customerAuth)
			.expect(200);
		expect(dishes.body.map((d) => d.name)).toContain('Demo Special');

		const back = await api
			.post('/api/demo/switch')
			.set(customerAuth)
			.expect(200);
		expect(back.body.user.id).toBe(vendor.user.id);
	});

	it('only lets demo accounts switch', async () => {
		const customer = await signUp('customer');
		await api.post('/api/demo/switch').set(customer.auth).expect(400);
		await api.post('/api/demo/switch').expect(401);
	});

	it('marks every document of a demo to expire with it, and nothing else', async () => {
		await startDemo('customer');
		const sandbox = await Sandbox.findOne();
		const models = [User, Restaurant, Dish, CartItem, Order, Sandbox];

		for (const model of models) {
			const indexes = await model.collection.indexes();
			expect(indexes).toContainEqual(
				expect.objectContaining({
					key: { expiresAt: 1 },
					expireAfterSeconds: 0,
				}),
			);
		}

		// the demo's restaurants, dishes, users and orders all expire with it
		for (const model of [User, Restaurant, Dish, Order]) {
			const inDemo = await model.find({ sandbox: sandbox._id });
			expect(inDemo.length).toBeGreaterThan(0);
			for (const doc of inDemo) {
				expect(doc.expiresAt).toEqual(sandbox.expiresAt);
			}
		}
		// real accounts and restaurants never expire
		expect(
			await User.countDocuments({ expiresAt: { $exists: true } }),
		).toBe(4);
		const real = await Restaurant.findOne({ name: 'Real Place' });
		expect(real.expiresAt).toBeUndefined();
		expect(real.sandbox).toBeNull();
	});

	it('stamps what a visitor adds with the demo expiry too', async () => {
		const vendor = await startDemo('vendor');
		const restaurant = await createRestaurant(vendor, {
			name: 'Visitor Bistro',
		});
		await createDish(vendor, restaurant.id, { name: 'Visitor Soup' });

		const sandbox = await Sandbox.findOne();
		for (const doc of [
			await Restaurant.findOne({ name: 'Visitor Bistro' }),
			await Dish.findOne({ name: 'Visitor Soup' }),
		]) {
			expect(doc.sandbox).toEqual(sandbox._id);
			expect(doc.expiresAt).toEqual(sandbox.expiresAt);
		}
	});

	it('stops working when the demo ends, even before MongoDB deletes it', async () => {
		const demo = await startDemo('customer');
		await User.updateMany(
			{ sandbox: { $ne: null } },
			{ expiresAt: new Date(Date.now() - 1000) },
		);

		const res = await api.get('/api/cart').set(demo.auth).expect(401);
		expect(res.body.message).toBe(
			'Your demo has ended. Start a new one any time.',
		);
		await api.get('/api/restaurants').set(demo.auth).expect(401);
	});

	it("can't be logged in to with a password", async () => {
		const demo = await startDemo('customer');
		const res = await api
			.post('/api/auth/login')
			.send({ email: demo.user.email, password: 'password123' })
			.expect(401);
		expect(res.body.message).toBe('Wrong email or password');
	});

	it('can be turned off, and is capped', async () => {
		config.DEMO_ENABLED = false;
		await api.post('/api/demo').send({}).expect(404);

		config.DEMO_ENABLED = true;
		config.DEMO_MAX_ACTIVE = 1;
		await startDemo('customer');
		const res = await api.post('/api/demo').send({}).expect(503);
		expect(res.body.message).toMatch(/very popular/);
	});

	it('rejects an unknown role', async () => {
		await api.post('/api/demo').send({ as: 'admin' }).expect(400);
	});
});

describe('settings for a public site', () => {
	it('tells the web app what to offer', async () => {
		const res = await api.get('/api/config').expect(200);
		expect(res.body).toEqual({
			signupsEnabled: true,
			demoEnabled: true,
			demoAccountsLogin: true,
			demoHours: 24,
		});
	});

	it('can turn off sign-ups', async () => {
		config.SIGNUPS_ENABLED = false;
		const res = await api
			.post('/api/auth/register')
			.send({
				email: 'new@test.dev',
				firstName: 'New',
				lastName: 'Person',
				password: 'password123',
			})
			.expect(403);
		expect(res.body.message).toMatch(/Try the demo/);
	});

	it('can stop the shared demo accounts logging in, so the showcase stays as it is', async () => {
		await seedDemoData();
		const login = () =>
			api
				.post('/api/auth/login')
				.send({ email: 'vendor@foodiez.dev', password: 'password123' });

		await login().expect(200);
		config.DEMO_ACCOUNTS_LOGIN = false;
		const res = await login().expect(401);
		expect(res.body.message).toBe('Wrong email or password');

		// everyone can still browse the showcase
		expect(await restaurantNames()).toHaveLength(5);
	});
});

describe('serving the web app', () => {
	it('serves the built files, and index.html for any page', async () => {
		const dir = mkdtempSync(path.join(tmpdir(), 'foodiez-web-'));
		mkdirSync(path.join(dir, 'assets'));
		writeFileSync(path.join(dir, 'index.html'), '<div id="root"></div>');
		writeFileSync(path.join(dir, 'assets', 'app-abc123.js'), 'run()');
		config.WEB_APP_DIR = dir;
		const web = request(createApp());

		const home = await web.get('/').expect(200);
		expect(home.text).toContain('<div id="root">');
		const page = await web.get('/restaurants/anything').expect(200);
		expect(page.text).toContain('<div id="root">');
		expect(page.headers['cache-control']).toBe('no-cache');

		const asset = await web.get('/assets/app-abc123.js').expect(200);
		expect(asset.headers['cache-control']).toContain('immutable');

		// unknown API routes are still JSON errors, not the web app
		const missing = await web.get('/api/nope').expect(404);
		expect(missing.body.message).toBe('Route GET /api/nope not found');
	});
});
