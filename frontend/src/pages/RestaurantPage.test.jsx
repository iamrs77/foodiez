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

const restaurant = {
	id: 'r1',
	name: 'Dosa Corner',
	cuisine: 'South Indian',
	location: 'Jayanagar, Bengaluru',
	priceForTwo: 300,
	deliveryTimeMinutes: 20,
	owner: vendor.id,
};

const dosa = {
	id: 'd1',
	name: 'Masala Dosa',
	description: 'Crispy dosa with potato',
	price: 120,
	isVeg: true,
};

const cartWith = (quantity) => ({
	restaurant: { id: 'r1', name: 'Dosa Corner' },
	items: [{ id: 'c1', quantity, dish: dosa }],
	total: dosa.price * quantity,
});

const menuApi = (extra = {}) => ({
	'GET /api/restaurants/r1': () => [200, restaurant],
	'GET /api/restaurants/r1/dishes': () => [200, [dosa]],
	'GET /api/cart': () => [200, emptyCart],
	...extra,
});

const dishRow = async () =>
	(await screen.findByRole('heading', { name: 'Masala Dosa' })).closest('li');

describe('restaurant page', () => {
	it('shows the menu and asks logged-out visitors to log in before adding', async () => {
		mockApi(menuApi());
		renderApp('/restaurants/r1');

		const row = await dishRow();
		expect(row).toHaveTextContent('₹120');
		expect(within(row).getByText('Vegetarian')).toBeInTheDocument();

		await userEvent.click(
			within(row).getByRole('button', { name: /add/i }),
		);
		expect(
			await screen.findByRole('heading', { name: 'Log in' }),
		).toBeInTheDocument();
	});

	it('lets a customer add a dish and shows the cart bar', async () => {
		const api = mockApi(
			menuApi({
				'POST /api/cart/items': ({ body }) => {
					expect(body).toEqual({ dishId: 'd1', quantity: 1 });
					return [200, cartWith(1)];
				},
			}),
		);
		renderApp('/restaurants/r1', { user: customer });

		const row = await dishRow();
		await userEvent.click(
			within(row).getByRole('button', { name: /add/i }),
		);

		expect(
			await within(row).findByLabelText('One more'),
		).toBeInTheDocument();
		expect(
			screen.getByRole('link', { name: /1 item · ₹120/i }),
		).toBeInTheDocument();
		expect(await requestsMade(api)).toContain('POST /api/cart/items');
	});

	it('asks before mixing restaurants, without calling the API', async () => {
		const api = mockApi(
			menuApi({
				'GET /api/cart': () => [
					200,
					{
						restaurant: { id: 'r2', name: 'Burger Barn' },
						items: [],
						total: 0,
					},
				],
			}),
		);
		renderApp('/restaurants/r1', { user: customer });

		await userEvent.click(
			within(await dishRow()).getByRole('button', { name: /add/i }),
		);

		expect(
			await screen.findByText(/Your cart has dishes from Burger Barn/),
		).toBeInTheDocument();
		expect(await requestsMade(api)).not.toContain('POST /api/cart/items');
	});

	it('offers to empty the cart when the API refuses a second restaurant', async () => {
		let cartCleared = false;
		const api = mockApi(
			menuApi({
				'POST /api/cart/items': () =>
					cartCleared
						? [200, cartWith(1)]
						: [
								409,
								{
									message:
										'Your cart has dishes from Burger Barn. Empty your cart to order from another restaurant.',
								},
							],
				'DELETE /api/cart': () => {
					cartCleared = true;
					return [200, emptyCart];
				},
			}),
		);
		renderApp('/restaurants/r1', { user: customer });

		await userEvent.click(
			within(await dishRow()).getByRole('button', { name: /add/i }),
		);
		expect(await screen.findByText(/Burger Barn/)).toBeInTheDocument();

		await userEvent.click(
			screen.getByRole('button', { name: 'Empty cart and add' }),
		);

		expect(
			await screen.findByRole('link', { name: /view cart/i }),
		).toHaveTextContent('1 item');
		expect(await requestsMade(api)).toContain('DELETE /api/cart');
	});

	it("shows the owner edit and delete buttons instead of 'Add'", async () => {
		mockApi(menuApi());
		renderApp('/restaurants/r1', { user: vendor });

		const row = await dishRow();
		expect(
			within(row).getByRole('link', { name: 'Edit Masala Dosa' }),
		).toBeInTheDocument();
		expect(
			within(row).getByRole('button', { name: 'Delete Masala Dosa' }),
		).toBeInTheDocument();
		expect(within(row).queryByRole('button', { name: /add/i })).toBeNull();
		expect(
			screen.getByRole('link', { name: /add dish/i }),
		).toBeInTheDocument();
	});
});
