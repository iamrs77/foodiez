import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function Boom() {
	throw new Error('broken page');
}

afterEach(() => vi.restoreAllMocks());

describe('error boundary', () => {
	it('shows a message instead of a blank page, and clears on the next page', () => {
		// React and the boundary report the crash; keep the test output clean
		vi.spyOn(console, 'error').mockImplementation(() => {});

		const { rerender } = render(
			<ErrorBoundary resetKey="/broken">
				<Boom />
			</ErrorBoundary>,
		);
		expect(screen.getByRole('alert')).toHaveTextContent(
			'Something went wrong on this page',
		);
		expect(screen.getByRole('button', { name: 'Reload' })).toBeVisible();

		rerender(
			<ErrorBoundary resetKey="/orders">
				<p>Your orders</p>
			</ErrorBoundary>,
		);
		expect(screen.getByText('Your orders')).toBeVisible();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
