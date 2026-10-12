import { Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { formatPrice } from '../lib/format';
import { getCuisineArt } from '../lib/cuisineArt';

export default function RestaurantCard({ restaurant }) {
	const { emoji, gradient } = getCuisineArt(restaurant.cuisine);

	return (
		<Link
			to={`/restaurants/${restaurant.id}`}
			className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl"
		>
			<div
				className={`flex h-40 items-center justify-center bg-linear-to-br text-7xl ${gradient}`}
				aria-hidden="true"
			>
				<span className="transition group-hover:scale-110">
					{emoji}
				</span>
			</div>
			<div className="p-4">
				<h3
					className="truncate text-xl font-bold uppercase"
					title={restaurant.name}
				>
					{restaurant.name}
				</h3>
				<p className="mt-1 truncate text-gray-600">
					{restaurant.cuisine}
				</p>
				<p className="mt-1 flex items-center gap-1 truncate text-sm text-gray-500">
					<MapPin size={14} className="shrink-0" />
					{restaurant.location}
				</p>
				<div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
					<span className="flex items-center gap-1">
						<Clock size={14} />
						{restaurant.deliveryTimeMinutes} mins
					</span>
					<span>{formatPrice(restaurant.priceForTwo)} for two</span>
				</div>
			</div>
		</Link>
	);
}
