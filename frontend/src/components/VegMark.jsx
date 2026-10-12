// the green and red square marks Indian food apps use for veg and non-veg dishes
export default function VegMark({ isVeg }) {
	const color = isVeg ? 'border-veg text-veg' : 'border-nonveg text-nonveg';
	return (
		<span
			className={`inline-flex h-4 w-4 shrink-0 items-center justify-center border-2 ${color}`}
			title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
		>
			<span className="h-2 w-2 rounded-full bg-current" />
			<span className="sr-only">
				{isVeg ? 'Vegetarian' : 'Non-vegetarian'}
			</span>
		</span>
	);
}
