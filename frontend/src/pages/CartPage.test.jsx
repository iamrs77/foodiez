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
};

describe('cart page', () => {
	it('says when the cart is empty', async () => {
		mockApi({ 'GET /api/cart': () => [200, emptyCart] });
		renderApp('/cart', { user: customer });
		expect(
			await screen.findByText('Your cart is empty'),
		).toBeInTheDocument();
	});

	it('shows the bill and places the order', async () => {
		let placed = false;
		mockApi({
			'GET /api/cart': () => [200, placed ? emptyCart : cart],
			'POST /api/orders': () => {
				placed = true;
				return [201, order];
			},
			'GET /api/orders': () => [200, placed ? [order] : []],
		});
		renderApp('/cart', { user: customer });

		expect(await screen.findByText('Masala Dosa')).toBeInTheDocument();
		expect(screen.getByText('To pay').nextSibling).toHaveTextContent(
			'₹280',
		);

		await userEvent.click(
			screen.getByRole('button', { name: 'Place order' }),
		);

		expect(await screen.findByText(/Order placed!/)).toBeInTheDocument();
		expect(screen.getByText('2 × Masala Dosa')).toBeInTheDocument();
	});
});
