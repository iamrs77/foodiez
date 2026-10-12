import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import App from '../App';
import { makeStore } from '../app/store';

export const customer = {
	id: 'u1',
	firstName: 'Priya',
	lastName: 'Nair',
	email: 'customer@foodiez.dev',
	role: 'customer',
};

export const vendor = {
	id: 'u2',
	firstName: 'Asha',
	lastName: 'Rao',
	email: 'vendor@foodiez.dev',
	role: 'vendor',
};

export const emptyCart = { restaurant: null, items: [], total: 0 };

// renders the whole app at a URL, optionally logged in
export function renderApp(route = '/', { user } = {}) {
	const store = makeStore({
		auth: user
			? { token: 'test-token', user }
			: { token: null, user: null },
	});
	const result = render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[route]}>
				<App />
			</MemoryRouter>
		</Provider>,
	);
	return { store, ...result };
}

const json = (status, data) =>
	new Response(status === 204 ? null : JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

// fakes the API: handlers look like { 'POST /api/auth/login': ({ body }) => [200, data] }
// returns the spy, so tests can check which requests were made
export function mockApi(handlers) {
	return vi
		.spyOn(globalThis, 'fetch')
		.mockImplementation(async (input, init) => {
			const request =
				input instanceof Request ? input : new Request(input, init);
			const url = new URL(request.url);
			const handler = handlers[`${request.method} ${url.pathname}`];
			if (!handler) {
				return json(404, {
					message: `No mock for ${request.method} ${url.pathname}`,
				});
			}
			const text = await request.clone().text();
			const [status, data] = await handler({
				body: text ? JSON.parse(text) : undefined,
				url,
			});
			return json(status, data);
		});
}

// the requests a mockApi spy received, as "METHOD /path" strings
export async function requestsMade(spy) {
	return Promise.all(
		spy.mock.calls.map(async ([input, init]) => {
			const request =
				input instanceof Request ? input : new Request(input, init);
			return `${request.method} ${new URL(request.url).pathname}`;
		}),
	);
}
