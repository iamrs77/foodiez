import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import { openApiSpec } from '../src/docs.js';
import { api, signUp } from './helpers.js';

const METHODS = ['get', 'post', 'patch', 'delete'];
const ANY_ID = '0123456789abcdef01234567';

// checks response bodies against the schemas in the spec
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(openApiSpec, 'openapi');

const pointer = (...parts) =>
	parts
		.map((p) => String(p).replaceAll('~', '~0').replaceAll('/', '~1'))
		.join('/');

// fails unless the response is one the spec documents for this operation,
// with a body that matches its schema exactly (no undocumented fields)
function expectDocumented(res, method, path) {
	const operation = openApiSpec.paths[path]?.[method];
	expect(
		operation,
		`${method.toUpperCase()} ${path} is in the spec`,
	).toBeDefined();
	let response = operation.responses[res.status];
	expect(
		response,
		`${method.toUpperCase()} ${path} documents a ${res.status}`,
	).toBeDefined();

	let location = ['paths', path, method, 'responses', res.status];
	if (response.$ref) {
		const name = response.$ref.split('/').at(-1);
		response = openApiSpec.components.responses[name];
		location = ['components', 'responses', name];
	}
	if (!response.content) {
		expect(res.text).toBe('');
		return;
	}
	const validate = ajv.getSchema(
		`openapi#/${pointer(...location, 'content', 'application/json', 'schema')}`,
	);
	if (!validate(res.body)) {
		throw new Error(
			`${method.toUpperCase()} ${path} ${res.status} doesn't match the spec:\n${ajv.errorsText(validate.errors, { separator: '\n' })}\n${JSON.stringify(res.body, null, 2)}`,
		);
	}
}

describe('the OpenAPI spec', () => {
	it('is valid OpenAPI 3.1', async () => {
		await expect(
			SwaggerParser.validate(structuredClone(openApiSpec)),
		).resolves.toBeTruthy();
	});

	it('only documents routes that exist', async () => {
		for (const [path, item] of Object.entries(openApiSpec.paths)) {
			for (const method of METHODS.filter((m) => item[m])) {
				const res = await api[method](path.replace('{id}', ANY_ID));
				expect(
					res.body.message ?? '',
					`${method.toUpperCase()} ${path}`,
				).not.toMatch(/^Route .* not found$/);
			}
		}
	});

	it('is served, with Swagger UI to read it', async () => {
		const spec = await api.get('/api/openapi.json').expect(200);
		expect(spec.body.info.title).toBe('Foodiez API');
		const ui = await api.get('/api/docs/').expect(200);
		expect(ui.text).toContain('swagger-initializer.js');
		const init = await api
			.get('/api/docs/swagger-initializer.js')
			.expect(200);
		expect(init.text).toContain("url: '/api/openapi.json'");
	});
});

describe('the API matches its spec', () => {
	it('for a customer, from browsing to ordering and cancelling', async () => {
		let res = await api.get('/api/health');
		expectDocumented(res, 'get', '/api/health');
		res = await api.get('/api/config');
		expectDocumented(res, 'get', '/api/config');

		res = await api.post('/api/demo').send({ as: 'customer' });
		expectDocumented(res, 'post', '/api/demo');
		const auth = { Authorization: `Bearer ${res.body.token}` };

		res = await api.get('/api/auth/me').set(auth);
		expectDocumented(res, 'get', '/api/auth/me');
		res = await api
			.get('/api/restaurants')
			.set(auth)
			.query({ sort: 'fastest' });
		expectDocumented(res, 'get', '/api/restaurants');
		const restaurant = res.body.find((r) => r.name === 'Dosa Corner');
		res = await api.get('/api/restaurants/cuisines').set(auth);
		expectDocumented(res, 'get', '/api/restaurants/cuisines');
		res = await api.get(`/api/restaurants/${restaurant.id}`).set(auth);
		expectDocumented(res, 'get', '/api/restaurants/{id}');
		res = await api
			.get(`/api/restaurants/${restaurant.id}/dishes`)
			.set(auth);
		expectDocumented(res, 'get', '/api/restaurants/{id}/dishes');
		const [dosa] = res.body;

		res = await api.get('/api/cart').set(auth);
		expectDocumented(res, 'get', '/api/cart');
		res = await api
			.post('/api/cart/items')
			.set(auth)
			.send({ dishId: dosa.id });
		expectDocumented(res, 'post', '/api/cart/items');
		res = await api
			.patch(`/api/cart/items/${res.body.items[0].id}`)
			.set(auth)
			.send({ quantity: 2 });
		expectDocumented(res, 'patch', '/api/cart/items/{id}');

		// a validation error, then the order, then a retry of it
		res = await api.post('/api/orders').set(auth).send({});
		expectDocumented(res, 'post', '/api/orders');
		const order = {
			delivery: {
				address: '1 Test Street, Bengaluru',
				phone: '+91 90000 00000',
			},
		};
		res = await api
			.post('/api/orders')
			.set(auth)
			.set('Idempotency-Key', 'contract-test-1')
			.send(order);
		expect(res.status).toBe(201);
		expectDocumented(res, 'post', '/api/orders');
		const placed = res.body;
		res = await api
			.post('/api/orders')
			.set(auth)
			.set('Idempotency-Key', 'contract-test-1')
			.send(order);
		expect(res.status).toBe(200);
		expectDocumented(res, 'post', '/api/orders');

		res = await api.get('/api/orders').set(auth);
		expectDocumented(res, 'get', '/api/orders');
		res = await api.get(`/api/orders/${placed.id}`).set(auth);
		expectDocumented(res, 'get', '/api/orders/{id}');
		res = await api.post(`/api/orders/${placed.id}/cancel`).set(auth);
		expectDocumented(res, 'post', '/api/orders/{id}/cancel');
		res = await api.post(`/api/orders/${placed.id}/cancel`).set(auth);
		expect(res.status).toBe(409);
		expectDocumented(res, 'post', '/api/orders/{id}/cancel');

		res = await api.delete('/api/cart').set(auth);
		expectDocumented(res, 'delete', '/api/cart');
		res = await api.post('/api/demo/switch').set(auth);
		expectDocumented(res, 'post', '/api/demo/switch');
	});

	it('for a vendor, from their restaurants to moving an order along', async () => {
		let res = await api.post('/api/demo').send({ as: 'vendor' });
		const auth = { Authorization: `Bearer ${res.body.token}` };

		res = await api.get('/api/restaurants/mine').set(auth);
		expectDocumented(res, 'get', '/api/restaurants/mine');
		res = await api.get('/api/vendor/orders').set(auth);
		expectDocumented(res, 'get', '/api/vendor/orders');
		res = await api
			.patch(`/api/vendor/orders/${res.body[0].id}`)
			.set(auth)
			.send({ status: 'accepted' });
		expectDocumented(res, 'patch', '/api/vendor/orders/{id}');
		res = await api
			.get('/api/vendor/orders')
			.set(auth)
			.query({ view: 'past' });
		expectDocumented(res, 'get', '/api/vendor/orders');

		res = await api.post('/api/restaurants').set(auth).send({
			name: 'Contract Kitchen',
			cuisine: 'Cafe',
			location: 'MG Road, Bengaluru',
			priceForTwo: 400,
			deliveryTimeMinutes: 25,
		});
		expectDocumented(res, 'post', '/api/restaurants');
		const restaurant = res.body;
		res = await api
			.patch(`/api/restaurants/${restaurant.id}`)
			.set(auth)
			.send({ image: 'https://images.example.com/kitchen.jpg' });
		expectDocumented(res, 'patch', '/api/restaurants/{id}');
		res = await api
			.post(`/api/restaurants/${restaurant.id}/dishes`)
			.set(auth)
			.send({ name: 'Cold Coffee', price: 120, category: 'Drinks' });
		expectDocumented(res, 'post', '/api/restaurants/{id}/dishes');
		res = await api
			.patch(`/api/dishes/${res.body.id}`)
			.set(auth)
			.send({ available: false });
		expectDocumented(res, 'patch', '/api/dishes/{id}');
		res = await api.delete(`/api/dishes/${res.body.id}`).set(auth);
		expectDocumented(res, 'delete', '/api/dishes/{id}');
		res = await api.delete(`/api/restaurants/${restaurant.id}`).set(auth);
		expectDocumented(res, 'delete', '/api/restaurants/{id}');
	});

	it('for logins and errors', async () => {
		const customer = await signUp('customer');
		const vendor = await signUp('vendor');

		let res = await api.post('/api/auth/register').send({
			email: 'spec@test.dev',
			firstName: 'Spec',
			lastName: 'Check',
			password: 'password123',
		});
		expectDocumented(res, 'post', '/api/auth/register');
		res = await api
			.post('/api/auth/login')
			.send({ email: 'spec@test.dev', password: 'password123' });
		expectDocumented(res, 'post', '/api/auth/login');
		res = await api
			.post('/api/auth/login')
			.send({ email: 'spec@test.dev', password: 'wrong-password' });
		expectDocumented(res, 'post', '/api/auth/login');

		res = await api.get('/api/cart');
		expect(res.status).toBe(401);
		expectDocumented(res, 'get', '/api/cart');
		res = await api.get('/api/cart').set(vendor.auth);
		expect(res.status).toBe(403);
		expectDocumented(res, 'get', '/api/cart');
		res = await api.get(`/api/restaurants/${ANY_ID}`).set(customer.auth);
		expect(res.status).toBe(404);
		expectDocumented(res, 'get', '/api/restaurants/{id}');
		res = await api.get('/api/restaurants/not-an-id');
		expect(res.status).toBe(400);
		expectDocumented(res, 'get', '/api/restaurants/{id}');
	});
});
