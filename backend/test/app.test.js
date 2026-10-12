import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD } from '../src/seed/demoData.js';
import { seedDemoData, seedIfEmpty } from '../src/seed/seed.js';
import { Restaurant } from '../src/models/Restaurant.js';
import { api, signUp } from './helpers.js';

describe('app', () => {
	it('reports health', async () => {
		const res = await api.get('/api/health').expect(200);
		expect(res.body.status).toBe('ok');
	});

	it('answers unknown routes and broken JSON with clear errors', async () => {
		const missing = await api.get('/api/nope').expect(404);
		expect(missing.body.message).toBe('Route GET /api/nope not found');

		const broken = await api
			.post('/api/auth/login')
			.set('Content-Type', 'application/json')
			.send('{"email":')
			.expect(400);
		expect(broken.body.message).toBe('Request body is not valid JSON');
	});

	it('sends security headers', async () => {
		const res = await api.get('/api/health');
		expect(res.headers['x-content-type-options']).toBe('nosniff');
		expect(res.headers['x-powered-by']).toBeUndefined();
	});
});

describe('demo data', () => {
	it('adds restaurants, menus and accounts you can log in with', async () => {
		const counts = await seedDemoData();
		expect(counts).toEqual({ users: 3, restaurants: 5, orders: 2 });

		const login = await api
			.post('/api/auth/login')
			.send({ email: 'customer@foodiez.dev', password: DEMO_PASSWORD })
			.expect(200);
		const orders = await api
			.get('/api/orders')
			.set('Authorization', `Bearer ${login.body.token}`)
			.expect(200);
		expect(orders.body).toHaveLength(2);
	});

	it('only fills an empty database on startup', async () => {
		await signUp('vendor');
		expect(await seedIfEmpty()).toBe(false);
		expect(await Restaurant.countDocuments()).toBe(0);
	});
});
