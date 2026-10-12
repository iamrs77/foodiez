import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useGetMyRestaurantsQuery } from '../../app/api';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import { SkeletonCards } from '../../components/Loading';
import RestaurantCard from '../../components/RestaurantCard';
import { getErrorMessage } from '../../lib/errors';

export default function MyRestaurantsPage() {
	const { data: restaurants, isLoading, error } = useGetMyRestaurantsQuery();

	return (
		<>
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold">My restaurants</h1>
					<p className="mt-1 text-gray-500">
						Open a restaurant to add, change or remove dishes.
					</p>
				</div>
				<Link to="/vendor/restaurants/new" className="btn btn-primary">
					<Plus size={16} /> Add restaurant
				</Link>
			</div>

			{isLoading && <SkeletonCards count={3} />}
			{error && <Alert type="error">{getErrorMessage(error)}</Alert>}
			{restaurants?.length === 0 && (
				<EmptyState emoji="🏪" title="No restaurants yet">
					Add your first restaurant, then add dishes to its menu.
				</EmptyState>
			)}
			{restaurants?.length > 0 && (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{restaurants.map((restaurant) => (
						<RestaurantCard
							key={restaurant.id}
							restaurant={restaurant}
						/>
					))}
				</div>
			)}
		</>
	);
}
