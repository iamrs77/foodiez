// grey placeholder blocks shown while data loads
export function SkeletonCards({ count = 6 }) {
	return (
		<div
			className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
			aria-busy="true"
			aria-label="Loading"
		>
			{Array.from({ length: count }, (_, index) => (
				<div key={index} className="card animate-pulse overflow-hidden">
					<div className="h-40 bg-gray-200" />
					<div className="space-y-3 p-4">
						<div className="h-5 w-2/3 rounded bg-gray-200" />
						<div className="h-4 w-1/2 rounded bg-gray-200" />
						<div className="h-4 w-3/4 rounded bg-gray-200" />
					</div>
				</div>
			))}
		</div>
	);
}

export function SkeletonRows({ count = 4 }) {
	return (
		<div className="space-y-4" aria-busy="true" aria-label="Loading">
			{Array.from({ length: count }, (_, index) => (
				<div
					key={index}
					className="card h-24 animate-pulse bg-gray-100"
				/>
			))}
		</div>
	);
}
