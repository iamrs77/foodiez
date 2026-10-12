import { describe, expect, it } from 'vitest';
import { User } from '../src/models/User.js';
import { api, signUp } from './helpers.js';

const newUser = {
	email: 'asha@example.com',
	firstName: 'Asha',
	lastName: 'Rao',
	password: 'password123',
};

describe('POST /api/auth/register', () => {
	it('creates a customer and returns a token, never the password hash', async () => {
		const res = await api
			.post('/api/auth/register')
			.send(newUser)
			.expect(201);

		expect(res.body.token).toEqual(expect.any(String));
		expect(res.body.user).toMatchObject({
			email: 'asha@example.com',
			firstName: 'Asha',
			role: 'customer',
		});
		expect(res.body.user.id).toEqual(expect.any(String));
		expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2b\$/);
	});

	it('creates a vendor when asked', async () => {
		const res = await api
			.post('/api/auth/register')
			.send({ ...newUser, role: 'vendor' })
			.expect(201);
		expect(res.body.user.role).toBe('vendor');
	});

	it('does not let anyone sign up as admin', async () => {
		const res = await api
			.post('/api/auth/register')
			.send({ ...newUser, role: 'admin' })
			.expect(400);
		expect(res.body.errors[0].field).toBe('role');
	});

	it('treats emails as case-insensitive', async () => {
		await api
			.post('/api/auth/register')
			.send({ ...newUser, email: '  Asha@Example.COM ' })
			.expect(201);
		const res = await api
			.post('/api/auth/register')
			.send(newUser)
			.expect(409);
		expect(res.body.message).toBe(
			'An account with this email already exists',
		);
	});

	it('rejects a short password and a bad email with field errors', async () => {
		const res = await api
			.post('/api/auth/register')
			.send({ ...newUser, email: 'not-an-email', password: 'short' })
			.expect(400);
		expect(res.body.errors.map((e) => e.field).sort()).toEqual([
			'email',
			'password',
		]);
	});

	it('answers an empty body with 400 and keeps the server running', async () => {
		await api.post('/api/auth/register').send({}).expect(400);
		await api.get('/api/health').expect(200);
	});
});

describe('POST /api/auth/login', () => {
	it('returns a token that works for /me', async () => {
		await signUp('customer', { email: 'priya@example.com' });
		const login = await api
			.post('/api/auth/login')
			.send({ email: 'PRIYA@example.com', password: 'password123' })
			.expect(200);

		const me = await api
			.get('/api/auth/me')
			.set('Authorization', `Bearer ${login.body.token}`)
			.expect(200);
		expect(me.body.email).toBe('priya@example.com');
		expect(me.body.passwordHash).toBeUndefined();
	});

	it('gives the same 401 for a wrong password and an unknown email', async () => {
		await signUp('customer', { email: 'priya@example.com' });

		const wrongPassword = await api
			.post('/api/auth/login')
			.send({ email: 'priya@example.com', password: 'wrong-password' })
			.expect(401);
		const unknownEmail = await api
			.post('/api/auth/login')
			.send({ email: 'nobody@example.com', password: 'password123' })
			.expect(401);

		expect(wrongPassword.body.message).toBe('Wrong email or password');
		expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
	});
});

describe('GET /api/auth/me', () => {
	it('needs a valid token', async () => {
		await api.get('/api/auth/me').expect(401);
		await api
			.get('/api/auth/me')
			.set('Authorization', 'Bearer not-a-real-token')
			.expect(401);
	});

	it('rejects the token of a deleted account', async () => {
		const customer = await signUp();
		await User.deleteOne({ _id: customer.user.id });
		await api.get('/api/auth/me').set(customer.auth).expect(401);
	});
});
