import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { customer, emptyCart, mockApi, renderApp } from '../test/utils';

const cart = {
	restaurant: { id: 'r1', name: 'Dosa Corner' },
	items: [
		{
			id: 'c1',
			quantity: 2,
			dish: { id: 'd1', name: 'Masala Dosa', price: 120, isVeg: true },
		},
		{
			id: 'c2',
			quantity: 1,
			dish: { id: 'd2', name: 'Filter Coffee', price: 40, isVeg: true },
		},
	],
	total: 280,
};

const delivery = {
	address: 'Flat 302, Lakeview Apartments, Koramangala',
	phone: '+91 98450 12345',
	note: '',
};

const order = {
	id: 'o1',
	restaurant: 'r1',
	restaurantName: 'Dosa Corner',
	createdAt: '2026-10-12T08:30:00.000Z',
	total: 280,
	items: [
		{ name: 'Masala Dosa', price: 120, quantity: 2, isVeg: true },
		{ name: 'Filter Coffee', price: 40, quantity: 1, isVeg: true },
	],
	delivery,
	status: 'placed',
	statusHistory: [{ status: 'placed', at: '2026-10-12T08:30:00.000Z' }],
};

describe('cart page', () => {
	it('says when the cart is empty', async () => {
		mockApi({ 'GET /api/cart': () => [200, emptyCart] });
		renderApp('/cart', { user: customer });
		expect(
			await screen.findByText('Your cart is empty'),
		).toBeInTheDocument();
	});

	it('shows the bill, asks where to deliver, and places the order', async () => {
		let placed = null;
		mockApi({
			'GET /api/cart': () => [200, placed ? emptyCart : cart],
			'GET /api/orders': () => [200, []],
			'POST /api/orders': ({ body, headers }) => {
				placed = { body, key: headers.get('Idempotency-Key') };
				return [201, order];
			},
			'GET /api/orders/o1': () => [200, order],
		});
		renderApp('/cart', { user: customer });

		expect(await screen.findByText('Masala Dosa')).toBeInTheDocument();
		expect(screen.getByText('To pay').nextSibling).toHaveTextContent(
			'₹280',
		);

		await userEvent.type(
			screen.getByLabelText('Address'),
			delivery.address,
		);
		await userEvent.type(screen.getByLabelText('Phone'), delivery.phone);
		await userEvent.click(
			screen.getByRole('button', { name: 'Place order · ₹280' }),
		);

		// the tracking page for the new order
		expect(await screen.findByText(/Order placed!/)).toBeInTheDocument();
		expect(screen.getByText('2 × Masala Dosa')).toBeInTheDocument();
		expect(placed.body).toEqual({ delivery });
		expect(placed.key).toMatch(/^[\w-]{8,}$/);
	});

	it('fills in the address from the last order', async () => {
		mockApi({
			'GET /api/cart': () => [200, cart],
			'GET /api/orders': () => [200, [order]],
		});
		renderApp('/cart', { user: customer });

		expect(await screen.findByLabelText('Address')).toHaveValue(
			delivery.address,
		);
		expect(screen.getByLabelText('Phone')).toHaveValue(delivery.phone);
	});

	it('retries a failed checkout with the same Idempotency-Key', async () => {
		const keys = [];
		mockApi({
			'GET /api/cart': () => [200, cart],
			'GET /api/orders': () => [200, [order]],
			'POST /api/orders': ({ headers }) => {
				keys.push(headers.get('Idempotency-Key'));
				return keys.length === 1
					? [
							500,
							{
								message:
									'Something went wrong, please try again',
							},
						]
					: [201, order];
			},
			'GET /api/orders/o1': () => [200, order],
		});
		renderApp('/cart', { user: customer });

		const placeButton = await screen.findByRole('button', {
			name: /Place order/,
		});
		await userEvent.click(placeButton);
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Something went wrong',
		);
		await userEvent.click(placeButton);

		expect(await screen.findByText(/Order placed!/)).toBeInTheDocument();
		expect(keys).toHaveLength(2);
		expect(keys[1]).toBe(keys[0]);
	});

	it('shows problems with the delivery details next to the fields', async () => {
		mockApi({
			'GET /api/cart': () => [200, cart],
			'GET /api/orders': () => [200, [order]],
			'POST /api/orders': () => [
				400,
				{
					message: 'Some fields are missing or invalid',
					errors: [
						{
							field: 'delivery.phone',
							message: 'Enter a phone number',
						},
					],
				},
			],
		});
		renderApp('/cart', { user: customer });

		await userEvent.click(
			await screen.findByRole('button', { name: /Place order/ }),
		);
		expect(
			await screen.findByText('Enter a phone number'),
		).toBeInTheDocument();
	});
});
