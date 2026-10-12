import { describe, expect, it } from 'vitest';
import { getErrorMessage, getFieldErrors } from './errors';

describe('getErrorMessage', () => {
	it("uses the API's message", () => {
		expect(
			getErrorMessage({
				status: 401,
				data: { message: 'Wrong email or password' },
			}),
		).toBe('Wrong email or password');
	});

	it('explains when the API is not running', () => {
		const unreachable = "Can't reach the server. Is the API running?";
		// no response at all
		expect(getErrorMessage({ status: 'FETCH_ERROR' })).toBe(unreachable);
		// the Vite dev server's empty 500 when the API is down
		expect(getErrorMessage({ status: 500, data: null })).toBe(unreachable);
		// nginx's HTML 502 page in Docker
		expect(
			getErrorMessage({
				status: 'PARSING_ERROR',
				originalStatus: 502,
				data: '<html>Bad Gateway</html>',
			}),
		).toBe(unreachable);
	});
});

describe('getFieldErrors', () => {
	it('maps API field errors to inputs', () => {
		expect(
			getFieldErrors({
				data: {
					errors: [
						{
							field: 'email',
							message: 'Enter a valid email address',
						},
					],
				},
			}),
		).toEqual({ email: 'Enter a valid email address' });
	});
});
