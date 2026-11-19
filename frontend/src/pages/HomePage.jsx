import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router';
import { useGetCuisinesQuery, useGetRestaurantsQuery } from '../app/api';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { SkeletonCards } from '../components/Loading';
import RestaurantCard from '../components/RestaurantCard';
import TryDemo from '../components/TryDemo';
import VegMark from '../components/VegMark';
import { selectUser } from '../features/auth/authSlice';
import { getErrorMessage } from '../lib/errors';
import { useDebouncedValue } from '../lib/useDebouncedValue';

const SORTS = [
	{ value: '', label: 'Newest' },
	{ value: 'fastest', label: 'Fastest delivery' },
	{ value: 'cheapest', label: 'Lowest price' },
];

const chipClass = (active) =>
	`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
		active
			? 'border-ink bg-ink text-white'
			: 'border-gray-300 bg-white hover:bg-gray-50'
	}`;

export default function HomePage() {
	const user = useSelector(selectUser);
	// the search and filters live in the URL (?q=pizza&veg=1), so they survive
	// reloads and can be shared
	const [params, setParams] = useSearchParams();
	const search = params.get('q') ?? '';
	const cuisine = params.get('cuisine') ?? '';
	const veg = params.get('veg') === '1';
	const sort = params.get('sort') ?? '';
	const query = useDebouncedValue(search.trim());

	const { data: cuisines = [] } = useGetCuisinesQuery();
	const {
		data: restaurants,
		isLoading,
		isFetching,
		error,
		refetch,
	} = useGetRestaurantsQuery({ search: query, cuisine, veg, sort });

	// the filters as last changed here. `params` only shows a change once React
	// has rendered it, so a quick second change (turning a filter off, then
	// typing) must build on this, or it would put the first change back
	const latest = useRef(params);
	useEffect(() => {
		latest.current = params;
	}, [params]);
	const replaceParams = (next) => {
		latest.current = next;
		setParams(next, { replace: true });
	};
	const setParam = (key, value) => {
		const next = new URLSearchParams(latest.current);
		if (value) {
			next.set(key, value);
		} else {
			next.delete(key);
		}
		replaceParams(next);
	};
	const handleSearch = (event) => setParam('q', event.target.value);
	const filtered = Boolean(query || cuisine || veg);

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
				<p>Try another name, cuisine or area.</p>
				{filtered && (
					<button
						type="button"
						className="btn btn-outline mt-4"
						onClick={() => replaceParams(new URLSearchParams())}
					>
						Clear search and filters
					</button>
				)}
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

			{!user && <TryDemo className="mt-6" />}

			<div
				className="mt-8 flex flex-wrap items-center gap-2"
				role="group"
				aria-label="Filters"
			>
				<button
					type="button"
					className={chipClass(!cuisine)}
					aria-pressed={!cuisine}
					onClick={() => setParam('cuisine', '')}
				>
					All
				</button>
				{cuisines.map((name) => (
					<button
						key={name}
						type="button"
						className={chipClass(cuisine === name)}
						aria-pressed={cuisine === name}
						onClick={() =>
							setParam('cuisine', cuisine === name ? '' : name)
						}
					>
						{name}
					</button>
				))}
				<button
					type="button"
					className={chipClass(veg)}
					aria-pressed={veg}
					onClick={() => setParam('veg', veg ? '' : '1')}
				>
					<VegMark isVeg /> Pure veg
				</button>
				<label className="ml-auto flex items-center gap-2 text-sm font-semibold">
					Sort by
					<select
						className="input w-auto py-1.5"
						value={sort}
						onChange={(event) =>
							setParam('sort', event.target.value)
						}
					>
						{SORTS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
			</div>

			<h2 className="mt-6 mb-6 text-2xl font-bold">
				{query ? `Results for "${query}"` : 'Top restaurants'}
			</h2>
			{content}
		</>
	);
}
