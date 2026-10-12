import { getCuisineArt } from '../lib/cuisineArt';

export default function CuisineTile({
	cuisine,
	className = 'h-24 w-24 text-5xl',
}) {
	const { emoji, gradient } = getCuisineArt(cuisine);
	return (
		<div
			className={`flex shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${gradient} ${className}`}
			aria-hidden="true"
		>
			{emoji}
		</div>
	);
}
