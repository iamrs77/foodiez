export default function EmptyState({ emoji, title, children }) {
	return (
		<div className="card mx-auto max-w-md p-10 text-center">
			<div className="text-5xl" aria-hidden="true">
				{emoji}
			</div>
			<h2 className="mt-4 text-xl font-bold">{title}</h2>
			<div className="mt-2 text-gray-500">{children}</div>
		</div>
	);
}
