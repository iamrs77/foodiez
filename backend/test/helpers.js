import request from 'supertest';
import { createApp } from '../src/app.js';

export const api = request(createApp());

let counter = 0;

// registers a new user and returns { user, token, auth } where auth is the header to send
export async function signUp(role = 'customer', overrides = {}) {
	counter += 1;
	const res = await api
		.post('/api/auth/register')
		.send({
			email: `${role}${counter}@test.dev`,
			firstName: 'Test',
			lastName: `User${counter}`,
			password: 'password123',
			role,
			...overrides,
		})
		.expect(201);
	return {
		user: res.body.user,
		token: res.body.token,
		auth: { Authorization: `Bearer ${res.body.token}` },
	};
}

export async function createRestaurant(vendor, overrides = {}) {
	counter += 1;
	const res = await api
		.post('/api/restaurants')
		.set(vendor.auth)
		.send({
			name: `Restaurant ${counter}`,
			cuisine: 'North Indian',
			location: 'HSR Layout, Bengaluru',
			priceForTwo: 500,
			deliveryTimeMinutes: 30,
			...overrides,
		})
		.expect(201);
	return res.body;
}

export async function createDish(vendor, restaurantId, overrides = {}) {
	counter += 1;
	const res = await api
		.post(`/api/restaurants/${restaurantId}/dishes`)
		.set(vendor.auth)
		.send({
			name: `Dish ${counter}`,
			description: 'Tasty',
			price: 200,
			isVeg: true,
			...overrides,
		})
		.expect(201);
	return res.body;
}
