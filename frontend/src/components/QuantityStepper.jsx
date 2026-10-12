import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({
	quantity,
	onChange,
	disabled,
	max = 20,
}) {
	return (
		<div className="inline-flex items-center rounded-full border border-gray-300 bg-white">
			<button
				type="button"
				className="cursor-pointer rounded-l-full p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
				onClick={() => onChange(quantity - 1)}
				disabled={disabled}
				aria-label="One less"
			>
				<Minus size={16} />
			</button>
			<span
				className="min-w-8 text-center font-semibold"
				aria-live="polite"
			>
				{quantity}
			</span>
			<button
				type="button"
				className="cursor-pointer rounded-r-full p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
				onClick={() => onChange(quantity + 1)}
				disabled={disabled || quantity >= max}
				aria-label="One more"
			>
				<Plus size={16} />
			</button>
		</div>
	);
}
