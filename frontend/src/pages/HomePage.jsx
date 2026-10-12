import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useGetRestaurantsQuery } from '../app/api';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { SkeletonCards } from '../components/Loading';
import RestaurantCard from '../components/RestaurantCard';
import { getErrorMessage } from '../lib/errors';
import { useDebouncedValue } from '../lib/useDebouncedValue';

export default function HomePage() {
	// the search lives in the URL (?q=pizza), so it survives reloads and can be shared
	const [params, setParams] = useSearchParams();
	const search = params.get('q') ?? '';
	const query = useDebouncedValue(search.trim());

	const {
		data: restaurants,
		isLoading,
		isFetching,
		error,
		refetch,
	} = useGetRestaurantsQuery(query);

	const handleSearch = (event) => {
		const value = event.target.value;
		setParams(value ? { q: value } : {}, { replace: true });
	};

	let content;
	if (error) {
		content = (
			<Alert
				type="error"
				action={
					<button
						type="button"
						className="btn btn-outline"
						onClick={refetch}
					>
						Try again
					</button>
				}
			>
				{getErrorMessage(error)}
			</Alert>
		);
	} else if (isLoading) {
		content = <SkeletonCards />;
	} else if (restaurants.length === 0) {
		content = (
			<EmptyState emoji="🔍" title="No restaurants found">
				Try another name, cuisine or area.
			</EmptyState>
		);
	} else {
		content = (
			<div
				className={`grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-60' : ''}`}
			>
				{restaurants.map((restaurant) => (
					<RestaurantCard
						key={restaurant.id}
						restaurant={restaurant}
					/>
				))}
			</div>
		);
	}

	return (
		<>
			<section className="rounded-3xl bg-linear-to-br from-brand to-amber-100 px-6 py-12 text-center sm:px-12">
				<h1 className="text-3xl font-bold sm:text-4xl">
					Hungry? We've got you.
				</h1>
				<p className="mt-2 text-lg">
					Order from great local restaurants in a few taps.
				</p>
				<label className="relative mx-auto mt-6 block max-w-xl">
					<span className="sr-only">Search restaurants</span>
					<Search
						size={20}
						className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
					/>
					<input
						type="search"
						value={search}
						onChange={handleSearch}
						placeholder="Search for a restaurant, cuisine or area"
						className="input rounded-full py-3 pl-12 shadow-sm"
					/>
				</label>
			</section>

			<h2 className="mt-10 mb-6 text-2xl font-bold">
				{query ? `Results for "${query}"` : 'Top restaurants'}
			</h2>
			{content}
		</>
	);
}
