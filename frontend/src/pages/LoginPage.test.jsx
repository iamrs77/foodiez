import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { customer, emptyCart, mockApi, renderApp, vendor } from '../test/utils';

async function logIn(email, password) {
	const user = userEvent.setup();
	await user.type(await screen.findByLabelText('Email'), email);
	await user.type(screen.getByLabelText('Password'), password);
	await user.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('login page', () => {
	it('logs a customer in and remembers the session', async () => {
		mockApi({
			'POST /api/auth/login': ({ body }) => [
				200,
				{
					token: 'token-123',
					user: { ...customer, email: body.email },
				},
			],
			'GET /api/restaurants': () => [200, []],
			'GET /api/cart': () => [200, emptyCart],
		});
		const { store } = renderApp('/login');

		await logIn(customer.email, 'password123');

		expect(await screen.findByText('Hi, Priya')).toBeInTheDocument();
		expect(store.getState().auth.token).toBe('token-123');
		expect(JSON.parse(localStorage.getItem('foodiez.session')).token).toBe(
			'token-123',
		);
	});

	it('takes vendors to their restaurants', async () => {
		mockApi({
			'POST /api/auth/login': () => [200, { token: 't', user: vendor }],
			'GET /api/restaurants/mine': () => [200, []],
		});
		renderApp('/login');

		await logIn(vendor.email, 'password123');

		expect(
			await screen.findByRole('heading', { name: 'My restaurants' }),
		).toBeInTheDocument();
	});

	it("shows the API's error message", async () => {
		mockApi({
			'POST /api/auth/login': () => [
				401,
				{ message: 'Wrong email or password' },
			],
		});
		renderApp('/login');

		await logIn(customer.email, 'wrong-password');

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Wrong email or password',
		);
	});

	it('fills in a demo account', async () => {
		renderApp('/login');
		await userEvent.click(
			await screen.findByRole('button', { name: 'Demo vendor' }),
		);
		expect(screen.getByLabelText('Email')).toHaveValue(
			'vendor@foodiez.dev',
		);
		expect(screen.getByLabelText('Password')).toHaveValue('password123');
	});
});
