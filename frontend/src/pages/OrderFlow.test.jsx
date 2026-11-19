import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { customer, emptyCart, mockApi, renderApp, vendor } from '../test/utils';

const at = (minutes) => new Date(Date.UTC(2026, 10, 19, 12, minutes)).toJSON();

function makeOrder(status, history = ['placed']) {
	return {
		id: 'o1',
		customerName: 'Rahul Verma',
		restaurant: 'r1',
		restaurantName: 'Napoli Slice',
		createdAt: at(0),
		total: 690,
		items: [
			{ name: 'Margherita Pizza', price: 350, quantity: 1, isVeg: true },
			{ name: 'Tiramisu', price: 170, quantity: 2, isVeg: true },
		],
		delivery: {
			address: '12, 2nd Main, Indiranagar',
			phone: '+91 99001 54321',
			note: 'Please ring the bell twice',
		},
		status,
		statusHistory: history.map((s, i) => ({ status: s, at: at(i * 5) })),
	};
}

afterEach(() => vi.restoreAllMocks());

describe('tracking an order', () => {
	it('shows how far the order has got, and what was ordered', async () => {
		mockApi({
			'GET /api/orders/o1': () => [
				200,
				makeOrder('preparing', ['placed', 'accepted', 'preparing']),
			],
			'GET /api/cart': () => [200, emptyCart],
		});
		renderApp('/orders/o1', { user: customer });

		expect(
			await screen.findByRole('heading', {
				name: 'Order from Napoli Slice',
			}),
		).toBeInTheDocument();
		const current = screen
			.getAllByRole('listitem')
			.find((li) => li.getAttribute('aria-current') === 'step');
		expect(current).toHaveTextContent('Being prepared');
		expect(screen.getByText('2 × Tiramisu')).toBeInTheDocument();
		expect(screen.getByText(/ring the bell twice/)).toBeInTheDocument();
		// too late to cancel
		expect(
			screen.queryByRole('button', { name: 'Cancel order' }),
		).not.toBeInTheDocument();
	});

	it('lets the customer cancel before the restaurant accepts', async () => {
		vi.spyOn(window, 'confirm').mockReturnValue(true);
		let cancelled = false;
		mockApi({
			'GET /api/orders/o1': () => [
				200,
				cancelled
					? makeOrder('cancelled', ['placed', 'cancelled'])
					: makeOrder('placed'),
			],
			'POST /api/orders/o1/cancel': () => {
				cancelled = true;
				return [200, makeOrder('cancelled', ['placed', 'cancelled'])];
			},
			'GET /api/orders': () => [200, []],
			'GET /api/cart': () => [200, emptyCart],
		});
		renderApp('/orders/o1', { user: customer });

		await userEvent.click(
			await screen.findByRole('button', { name: 'Cancel order' }),
		);

		expect(await screen.findByText(/Cancelled at/)).toBeInTheDocument();
	});
});

describe("a restaurant's orders", () => {
	it('shows new orders and moves them to the next step', async () => {
		let order = makeOrder('placed');
		const changes = [];
		mockApi({
			'GET /api/vendor/orders': () => [200, [order]],
			'PATCH /api/vendor/orders/o1': ({ body }) => {
				changes.push(body.status);
				order = makeOrder(body.status, ['placed', body.status]);
				return [200, order];
			},
		});
		renderApp('/vendor/orders', { user: vendor });

		const card = (
			await screen.findByRole('heading', { name: /Rahul Verma/ })
		).closest('li');
		expect(within(card).getByText(/ring the bell twice/)).toBeVisible();
		expect(
			screen.getByRole('link', { name: 'Orders, 1 new' }),
		).toBeInTheDocument();

		await userEvent.click(
			within(card).getByRole('button', { name: 'Accept' }),
		);

		expect(
			await screen.findByRole('button', { name: 'Start preparing' }),
		).toBeInTheDocument();
		expect(changes).toEqual(['accepted']);
		expect(
			screen.getByRole('link', { name: 'Orders, 0 new' }),
		).toBeInTheDocument();
	});

	it('shows finished orders under Done', async () => {
		mockApi({
			'GET /api/vendor/orders': ({ url }) => [
				200,
				url.searchParams.get('view') === 'past'
					? [makeOrder('delivered', ['placed', 'delivered'])]
					: [],
			],
		});
		renderApp('/vendor/orders', { user: vendor });

		expect(
			await screen.findByText('No orders waiting'),
		).toBeInTheDocument();
		await userEvent.click(screen.getByRole('tab', { name: 'Done' }));
		expect(await screen.findByText('Delivered')).toBeInTheDocument();
	});
});
