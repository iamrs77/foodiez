import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
	customer,
	emptyCart,
	mockApi,
	renderApp,
	requestsMade,
	vendor,
} from '../test/utils';

const in24Hours = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toJSON();
const demoCustomer = () => ({ ...customer, expiresAt: in24Hours() });
const demoVendor = () => ({ ...vendor, expiresAt: in24Hours() });

// the settings of the public demo site
const publicSite = {
	signupsEnabled: false,
	demoEnabled: true,
	demoAccountsLogin: false,
	demoHours: 24,
};

describe('try the demo', () => {
	it('starts a private demo as a customer from the home page', async () => {
		const spy = mockApi({
			'GET /api/config': () => [200, publicSite],
			'GET /api/restaurants': () => [200, []],
			'POST /api/demo': ({ body }) => [
				201,
				{ token: 'demo-token', user: demoCustomer(), as: body.as },
			],
			'GET /api/cart': () => [200, emptyCart],
		});
		const { store } = renderApp('/');

		await userEvent.click(
			await screen.findByRole('button', { name: /Try as a customer/ }),
		);

		expect(await screen.findByText('Hi, Priya')).toBeInTheDocument();
		expect(store.getState().auth.token).toBe('demo-token');
		expect(screen.getByText('This is your private demo.')).toBeVisible();
		expect(screen.getByText(/deleted in about 24 hours/)).toBeVisible();
		// the demo card is only for visitors who aren't in a demo yet
		expect(
			screen.queryByRole('button', { name: /Try as a customer/ }),
		).not.toBeInTheDocument();
		const requests = await requestsMade(spy);
		expect(requests).toContain('POST /api/demo');
		// the restaurants are loaded again, now from the visitor's own demo
		expect(
			requests.filter((r) => r === 'GET /api/restaurants'),
		).toHaveLength(2);
	});

	it('takes a demo restaurant owner to their restaurants', async () => {
		mockApi({
			'GET /api/config': () => [200, publicSite],
			'GET /api/restaurants': () => [200, []],
			'POST /api/demo': () => [
				201,
				{ token: 'demo-token', user: demoVendor() },
			],
			'GET /api/restaurants/mine': () => [200, []],
		});
		renderApp('/login');

		await userEvent.click(
			await screen.findByRole('button', {
				name: /Try as a restaurant owner/,
			}),
		);

		expect(
			await screen.findByRole('heading', { name: 'My restaurants' }),
		).toBeInTheDocument();
	});

	it('switches from the restaurant owner to the customer of the same demo', async () => {
		const spy = mockApi({
			'GET /api/config': () => [200, publicSite],
			'GET /api/restaurants/mine': () => [200, []],
			'POST /api/demo/switch': () => [
				200,
				{ token: 'customer-token', user: demoCustomer() },
			],
			'GET /api/restaurants': () => [200, []],
			'GET /api/cart': () => [200, emptyCart],
		});
		const { store } = renderApp('/vendor', { user: demoVendor() });

		await userEvent.click(
			await screen.findByRole('button', {
				name: 'Switch to the customer',
			}),
		);

		expect(await screen.findByText('Hi, Priya')).toBeInTheDocument();
		expect(store.getState().auth.token).toBe('customer-token');
		expect(
			screen.getByRole('button', {
				name: 'Switch to the restaurant owner',
			}),
		).toBeVisible();
		expect(await requestsMade(spy)).toContain('POST /api/demo/switch');
	});

	it("shows the API's message when the demo is busy", async () => {
		mockApi({
			'GET /api/config': () => [200, publicSite],
			'GET /api/restaurants': () => [200, []],
			'POST /api/demo': () => [
				503,
				{ message: 'The demo is very popular right now.' },
			],
		});
		renderApp('/');

		await userEvent.click(
			await screen.findByRole('button', { name: /Try as a customer/ }),
		);

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'The demo is very popular right now.',
		);
	});

	it("doesn't show the banner to real accounts", async () => {
		mockApi({
			'GET /api/config': () => [200, publicSite],
			'GET /api/restaurants': () => [200, []],
			'GET /api/cart': () => [200, emptyCart],
		});
		renderApp('/', { user: customer });

		expect(await screen.findByText('Hi, Priya')).toBeInTheDocument();
		expect(
			screen.queryByText('This is your private demo.'),
		).not.toBeInTheDocument();
	});
});

describe('on the public demo site', () => {
	it('offers the demo instead of sign-up and the shared demo accounts', async () => {
		mockApi({
			'GET /api/config': () => [200, publicSite],
		});
		renderApp('/login');

		expect(
			await screen.findByRole('button', { name: /Try as a customer/ }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'Demo vendor' }),
		).not.toBeInTheDocument();
		expect(screen.queryByText('Create an account')).not.toBeInTheDocument();

		const nav = screen.getByRole('navigation');
		expect(
			within(nav).getByRole('link', { name: 'Try the demo' }),
		).toBeInTheDocument();
		expect(
			within(nav).queryByRole('link', { name: 'Sign up' }),
		).not.toBeInTheDocument();
	});

	it('explains that sign-ups are off', async () => {
		mockApi({
			'GET /api/config': () => [200, publicSite],
		});
		renderApp('/register');

		expect(
			await screen.findByText(/New accounts are turned off/),
		).toBeInTheDocument();
		expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
	});
});
