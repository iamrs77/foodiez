import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { customer, emptyCart, mockApi, renderApp, vendor } from './test/utils';

const restaurants = [
	{
		id: 'r1',
		name: 'Dosa Corner',
		cuisine: 'South Indian',
		location: 'Jayanagar, Bengaluru',
		priceForTwo: 300,
		deliveryTimeMinutes: 20,
		owner: 'u2',
	},
];

describe('pages that need a login', () => {
	it('send logged-out visitors to the login page', async () => {
		renderApp('/cart');
		expect(
			await screen.findByRole('heading', { name: 'Log in' }),
		).toBeInTheDocument();
	});

	it('send vendors home from customer pages', async () => {
		mockApi({ 'GET /api/restaurants': () => [200, restaurants] });
		renderApp('/cart', { user: vendor });
		expect(
			await screen.findByRole('heading', {
				name: "Hungry? We've got you.",
			}),
		).toBeInTheDocument();
	});

	it('come back to the page that asked for the login', async () => {
		mockApi({
			'POST /api/auth/login': () => [200, { token: 't', user: customer }],
			'GET /api/orders': () => [200, []],
			'GET /api/cart': () => [200, emptyCart],
		});
		const user = userEvent.setup();
		renderApp('/orders');

		await user.type(await screen.findByLabelText('Email'), customer.email);
		await user.type(screen.getByLabelText('Password'), 'password123');
		await user.click(screen.getByRole('button', { name: 'Log in' }));

		expect(await screen.findByText('No orders yet')).toBeInTheDocument();
	});
});

describe('home page', () => {
	it('lists restaurants with their details', async () => {
		mockApi({ 'GET /api/restaurants': () => [200, restaurants] });
		renderApp('/');

		const card = await screen.findByRole('link', { name: /dosa corner/i });
		expect(card).toHaveAttribute('href', '/restaurants/r1');
		expect(card).toHaveTextContent('20 mins');
		expect(card).toHaveTextContent('₹300 for two');
	});

	it('explains when the API is down', async () => {
		mockApi({
			'GET /api/restaurants': () => [
				500,
				{ message: 'Something went wrong, please try again' },
			],
		});
		renderApp('/');
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Something went wrong',
		);
	});
});

it('shows a friendly page for unknown URLs', async () => {
	renderApp('/no-such-page');
	expect(await screen.findByText('Page not found')).toBeInTheDocument();
});
