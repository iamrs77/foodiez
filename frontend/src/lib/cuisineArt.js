// restaurants have no photos, so each card gets an emoji and colours that
// match its cuisine (full class names, so Tailwind can find them)
const CUISINE_ART = [
	[/pizza|italian|pasta/i, '🍕', 'from-red-200 to-orange-100'],
	[/burger|fast food|american/i, '🍔', 'from-amber-200 to-yellow-50'],
	[/chinese|asian|thai|noodle|wok/i, '🍜', 'from-orange-200 to-rose-100'],
	[/south indian|dosa|idli/i, '🫓', 'from-lime-200 to-emerald-50'],
	[/indian|curry|biryani|tandoor/i, '🍛', 'from-yellow-200 to-orange-100'],
	[/dessert|cake|bakery|sweet|ice cream/i, '🍰', 'from-pink-200 to-rose-50'],
	[/cafe|coffee|tea/i, '☕', 'from-stone-300 to-amber-50'],
	[/healthy|salad|vegan/i, '🥗', 'from-green-200 to-lime-50'],
];

const DEFAULT_ART = ['🍽️', 'from-brand to-amber-50'];

export function getCuisineArt(cuisine = '') {
	const match = CUISINE_ART.find(([pattern]) => pattern.test(cuisine));
	const [emoji, gradient] = match ? match.slice(1) : DEFAULT_ART;
	return { emoji, gradient };
}
