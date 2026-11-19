import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { customer, emptyCart, mockApi, renderApp, vendor } from '../test/utils';

const restaurant = {
	id: 'r1',
	name: 'Wok Express',
	cuisine: 'Chinese',
	location: 'Koramangala, Bengaluru',
	priceForTwo: 500,
	deliveryTimeMinutes: 25,
	owner: vendor.id,
	image: '/images/restaurants/wok-express.webp',
};

const dish = (id, name, category, extra = {}) => ({
	id,
	name,
	category,
	description: '',
	price: 200,
	isVeg: true,
	available: true,
	image: '',
	...extra,
});

const dishes = [
	dish('d1', 'Chilli Chicken', 'Starters', { isVeg: false }),
	dish('d2', 'Veg Manchurian', 'Starters'),
	dish('d3', 'Veg Hakka Noodles', 'Noodles and rice', { available: false }),
];

const menuApi = (extra = {}) => ({
	'GET /api/restaurants/r1': () => [200, restaurant],
	'GET /api/restaurants/r1/dishes': () => [200, dishes],
	'GET /api/cart': () => [200, emptyCart],
	...extra,
});

describe('a menu', () => {
	it('is grouped into the restaurant’s sections, in order', async () => {
		mockApi(menuApi());
		renderApp('/restaurants/r1', { user: customer });

		const sections = await screen.findAllByRole('region');
		expect(sections.map((s) => s.getAttribute('aria-label'))).toEqual([
			'Starters',
			'Noodles and rice',
		]);
		expect(
			within(sections[0]).getByRole('heading', {
				name: 'Chilli Chicken',
			}),
		).toBeVisible();
	});

	it('can show only veg dishes', async () => {
		mockApi(menuApi());
		renderApp('/restaurants/r1', { user: customer });

		await screen.findByRole('heading', { name: 'Chilli Chicken' });
		await userEvent.click(screen.getByLabelText(/Veg only/));
		expect(
			screen.queryByRole('heading', { name: 'Chilli Chicken' }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: 'Veg Manchurian' }),
		).toBeVisible();
	});

	it('shows sold out dishes, which customers can’t add', async () => {
		mockApi(menuApi());
		renderApp('/restaurants/r1', { user: customer });

		const row = (
			await screen.findByRole('heading', { name: 'Veg Hakka Noodles' })
		).closest('li');
		expect(within(row).getAllByText('Sold out')).toHaveLength(2);
		expect(within(row).queryByRole('button')).not.toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Add Veg Manchurian' }),
		).toBeEnabled();
	});

	it('lets the owner mark a dish sold out, and back in stock', async () => {
		const changes = [];
		mockApi(
			menuApi({
				'PATCH /api/dishes/d2': ({ body }) => {
					changes.push(body);
					return [200, { ...dishes[1], ...body }];
				},
			}),
		);
		renderApp('/restaurants/r1', { user: vendor });

		const row = (
			await screen.findByRole('heading', { name: 'Veg Manchurian' })
		).closest('li');
		await userEvent.click(
			within(row).getByRole('button', { name: 'Mark sold out' }),
		);
		await waitFor(() => expect(changes).toEqual([{ available: false }]));

		const soldOutRow = (
			await screen.findByRole('heading', { name: 'Veg Hakka Noodles' })
		).closest('li');
		expect(
			within(soldOutRow).getByRole('button', { name: 'Back in stock' }),
		).toBeVisible();
	});
});

describe('finding restaurants', () => {
	it('filters by cuisine and pure veg, and sorts, through the URL', async () => {
		const queries = [];
		mockApi({
			'GET /api/restaurants': ({ url }) => {
				queries.push(url.search);
				return [200, []];
			},
			'GET /api/restaurants/cuisines': () => [200, ['Chinese', 'Pizza']],
		});
		renderApp('/');

		await userEvent.click(
			await screen.findByRole('button', { name: 'Pizza' }),
		);
		await userEvent.click(screen.getByRole('button', { name: /Pure veg/ }));
		await userEvent.selectOptions(
			screen.getByLabelText('Sort by'),
			'Fastest delivery',
		);

		await waitFor(() =>
			expect(queries.at(-1)).toBe('?cuisine=Pizza&veg=true&sort=fastest'),
		);
		expect(screen.getByRole('button', { name: 'Pizza' })).toHaveAttribute(
			'aria-pressed',
			'true',
		);
		expect(await screen.findByText('No restaurants found')).toBeVisible();
		await userEvent.click(
			screen.getByRole('button', { name: 'Clear search and filters' }),
		);
		// back to everything (served from the cache: that list was loaded first)
		expect(
			await screen.findByRole('button', { name: 'All', pressed: true }),
		).toBeVisible();
		expect(queries[0]).toBe('');
	});
});

describe('a cart with a sold out dish', () => {
	it('says so and doesn’t let the customer order', async () => {
		mockApi({
			'GET /api/cart': () => [
				200,
				{
					restaurant: { id: 'r1', name: 'Wok Express' },
					items: [
						{
							id: 'c1',
							quantity: 1,
							dish: { ...dishes[2] },
						},
					],
					total: 200,
				},
			],
			'GET /api/orders': () => [200, []],
		});
		renderApp('/cart', { user: customer });

		expect(
			await screen.findByText('Sold out now: remove it to order'),
		).toBeVisible();
		expect(
			screen.getByRole('button', { name: /Place order/ }),
		).toBeDisabled();
	});
});
