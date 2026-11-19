import { test as base, expect } from '@playwright/test';

// collects what would show up as errors in the browser's console: crashes,
// console errors and server errors. 4xx responses are expected in some tests.
function watch(page) {
	const problems = [];
	page.on('console', (message) => {
		if (
			message.type() === 'error' &&
			!/status of 4\d\d/.test(message.text())
		) {
			problems.push(`console: ${message.text()}`);
		}
	});
	page.on('pageerror', (error) => problems.push(`crash: ${error.message}`));
	page.on('response', (response) => {
		if (response.url().includes('/api/') && response.status() >= 500) {
			problems.push(`${response.status()} ${response.url()}`);
		}
	});
	page.on('dialog', (dialog) => dialog.accept());
	return problems;
}

// every test fails if its page logged an error, even if the steps passed
const test = base.extend({
	page: async ({ page }, use) => {
		const problems = watch(page);
		await use(page);
		expect(problems, 'errors in the browser').toEqual([]);
	},
});

const restaurant = (page, name) =>
	page.getByRole('link', { name: new RegExp(name) }).first();

async function startDemo(page, as = 'customer') {
	await page.goto('/login');
	await page
		.getByRole('button', {
			name:
				as === 'vendor'
					? /Try as a restaurant owner/
					: /Try as a customer/,
		})
		.click();
	await expect(page.getByText('This is your private demo.')).toBeVisible();
}

test('logged-out visitors browse the showcase, which nobody can change', async ({
	page,
}) => {
	await page.goto('/');
	for (const name of [
		'Spice Route',
		'Napoli Slice',
		'Dosa Corner',
		'Wok Express',
		'Burger Barn',
	]) {
		await expect(restaurant(page, name)).toBeVisible();
	}
	await expect(
		page.getByRole('heading', { name: 'Try the demo' }),
	).toBeVisible();

	// a menu opens, also when its address is loaded directly
	await restaurant(page, 'Dosa Corner').click();
	await expect(page.getByText('Masala Dosa')).toBeVisible();
	await page.reload();
	await expect(page.getByText('Masala Dosa')).toBeVisible();

	// no sign-ups, and the shared demo accounts are locked
	await page.goto('/register');
	await expect(page.getByText(/New accounts are turned off/)).toBeVisible();
	await page.goto('/login');
	await expect(
		page.getByRole('heading', { name: 'Try the demo' }),
	).toBeVisible();
	await expect(page.getByRole('button', { name: 'Demo vendor' })).toHaveCount(
		0,
	);
	await page.getByLabel('Email').fill('vendor@foodiez.dev');
	await page.getByLabel('Password').fill('password123');
	await page.getByRole('button', { name: 'Log in' }).click();
	await expect(page.getByText('Wrong email or password')).toBeVisible();
});

test('a demo visitor orders, then runs the restaurant that receives it', async ({
	page,
}) => {
	await startDemo(page, 'customer');
	await expect(page.getByText('Hi, Priya')).toBeVisible();

	// the demo customer's history
	await page.getByRole('link', { name: 'Orders' }).click();
	await expect(page.getByRole('link', { name: /Dosa Corner/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /Spice Route/ })).toBeVisible();

	// order a masala dosa; the address comes from the last order
	await page.getByRole('link', { name: 'Foodiez home' }).click();
	await restaurant(page, 'Dosa Corner').click();
	await page.getByRole('button', { name: 'Add Masala Dosa' }).click();
	await page.getByRole('link', { name: 'Cart, 1 item' }).click();
	await expect(page.getByLabel('Address')).toHaveValue(/Koramangala/);
	await page.getByRole('button', { name: /Place order/ }).click();
	await expect(
		page.getByRole('heading', { name: 'Order from Dosa Corner' }),
	).toBeVisible();
	await expect(page.locator('[aria-current="step"]')).toHaveText(
		/Order placed/,
	);

	// the restaurant owner of the same demo receives it, with Rahul's from the demo data
	await page
		.getByRole('button', { name: 'Switch to the restaurant owner' })
		.click();
	await expect(page.getByText('Hi, Asha')).toBeVisible();
	await page.getByRole('link', { name: 'Orders, 2 new' }).click();
	const order = page.locator('li', {
		has: page.getByRole('heading', { name: /Priya Nair/ }),
	});
	await expect(order.getByText(/Koramangala/)).toBeVisible();
	await order.getByRole('button', { name: 'Accept' }).click();
	await order.getByRole('button', { name: 'Start preparing' }).click();
	await expect(
		order.getByRole('button', { name: 'Send out for delivery' }),
	).toBeVisible();
	await expect(
		page.getByRole('link', { name: 'Orders, 1 new' }),
	).toBeVisible();

	// and the customer sees where it's got to
	await page.getByRole('button', { name: 'Switch to the customer' }).click();
	await page.getByRole('link', { name: 'Orders' }).click();
	await page
		.getByRole('link', { name: /Dosa Corner/ })
		.first()
		.click();
	await expect(page.locator('[aria-current="step"]')).toHaveText(
		/Being prepared/,
	);
});

test("a restaurant owner's menu changes reach their own demo, and nobody else's", async ({
	page,
	browser,
}) => {
	await startDemo(page, 'vendor');
	await expect(
		page.getByRole('heading', { name: 'My restaurants' }),
	).toBeVisible();

	await restaurant(page, 'Spice Route').click();
	await page.getByRole('link', { name: /Edit details/ }).click();
	await page.getByLabel('Name').fill('Spice Route by Visitor One');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(
		page.getByRole('heading', { name: 'Spice Route by Visitor One' }),
	).toBeVisible();
	await page.getByRole('link', { name: /Add dish/ }).click();
	await page.getByLabel('Name').fill('Visitor Special');
	await page.getByLabel('Price (₹)').fill('199');
	await page.getByRole('button', { name: 'Add dish' }).click();
	await expect(page.getByText('Visitor Special')).toBeVisible();

	// the demo's customer sees the change
	await page.getByRole('button', { name: 'Switch to the customer' }).click();
	await restaurant(page, 'Spice Route by Visitor One').click();
	await expect(page.getByText('Visitor Special')).toBeVisible();

	// another visitor, and a logged-out one, see the original
	const other = await (await browser.newContext()).newPage();
	const problems = watch(other);
	await startDemo(other, 'vendor');
	await expect(restaurant(other, 'Spice Route')).toBeVisible();
	await expect(restaurant(other, 'Visitor One')).toHaveCount(0);
	await expect(
		other.getByRole('link', { name: 'Orders, 1 new' }),
	).toBeVisible();

	const anonymous = await (await browser.newContext()).newPage();
	await anonymous.goto('/');
	await expect(restaurant(anonymous, 'Spice Route')).toBeVisible();
	await expect(restaurant(anonymous, 'Visitor One')).toHaveCount(0);
	expect(problems).toEqual([]);
});

test('a demo survives a reload, and logging out returns to the showcase', async ({
	page,
}) => {
	await startDemo(page, 'vendor');
	await page.reload();
	await expect(
		page.getByRole('heading', { name: 'My restaurants' }),
	).toBeVisible();
	await expect(page.getByText('This is your private demo.')).toBeVisible();

	await page.getByRole('button', { name: /Log out/ }).click();
	await expect(
		page.getByRole('heading', { name: 'Try the demo' }),
	).toBeVisible();
	await expect(page.getByText('This is your private demo.')).toHaveCount(0);
});

test('visitors filter, search and read menus by section', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Pizza' }).click();
	await expect(restaurant(page, 'Napoli Slice')).toBeVisible();
	await expect(restaurant(page, 'Spice Route')).toHaveCount(0);

	await page.getByRole('button', { name: 'All' }).click();
	await page.getByRole('button', { name: /Pure veg/ }).click();
	await expect(restaurant(page, 'Dosa Corner')).toBeVisible();
	await expect(restaurant(page, 'Napoli Slice')).toHaveCount(0);
	await page.getByRole('button', { name: /Pure veg/ }).click();

	await page.getByPlaceholder(/Search for a restaurant/).fill('burg');
	await expect(restaurant(page, 'Burger Barn')).toBeVisible();
	await expect(restaurant(page, 'Dosa Corner')).toHaveCount(0);

	// the menu, in sections, with the sold-out shake
	await restaurant(page, 'Burger Barn').click();
	await expect(page.getByRole('region', { name: 'Burgers' })).toBeVisible();
	const shake = page.locator('li', {
		has: page.getByRole('heading', { name: 'Chocolate Shake' }),
	});
	await expect(shake.getByText('Sold out').first()).toBeVisible();
	await expect(shake.getByRole('button')).toHaveCount(0);
});
