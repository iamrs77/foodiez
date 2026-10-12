import { describe, expect, it } from 'vitest';
import { getCuisineArt } from './cuisineArt';
import { formatPrice } from './format';

describe('formatPrice', () => {
	it('shows rupees with Indian digit grouping', () => {
		expect(formatPrice(1234)).toBe('₹1,234');
		expect(formatPrice(123456)).toBe('₹1,23,456');
		expect(formatPrice(99.5)).toBe('₹99.5');
	});
});

describe('getCuisineArt', () => {
	it('picks an emoji from the cuisine', () => {
		expect(getCuisineArt('Italian, Pizza').emoji).toBe('🍕');
		expect(getCuisineArt('South Indian').emoji).toBe('🫓');
		expect(getCuisineArt('North Indian').emoji).toBe('🍛');
		expect(getCuisineArt('Something new').emoji).toBe('🍽️');
	});
});
