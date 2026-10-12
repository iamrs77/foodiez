import { Link, useLocation } from 'react-router';
import { useGetOrdersQuery } from '../app/api';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { SkeletonRows } from '../components/Loading';
import VegMark from '../components/VegMark';
import { getErrorMessage } from '../lib/errors';
import { formatDateTime, formatPrice } from '../lib/format';

export default function OrdersPage() {
	const location = useLocation();
	const placedOrderId = location.state?.placedOrderId;
	const { data: orders, isLoading, error } = useGetOrdersQuery();

	if (isLoading) {
		return <SkeletonRows />;
	}
	if (error) {
		return <Alert type="error">{getErrorMessage(error)}</Alert>;
	}

	return (
		<>
			<h1 className="mb-6 text-3xl font-bold">Your orders</h1>

			{placedOrderId && (
				<div className="mb-6">
					<Alert type="success">
						Order placed! Your food is on its way.
					</Alert>
				</div>
			)}

			{orders.length === 0 ? (
				<EmptyState emoji="🧾" title="No orders yet">
					<p>When you place an order, it shows up here.</p>
					<Link to="/" className="btn btn-primary mt-6">
						Browse restaurants
					</Link>
				</EmptyState>
			) : (
				<ul className="space-y-4">
					{orders.map((order) => (
						<li
							key={order.id}
							className={`card p-5 ${order.id === placedOrderId ? 'ring-2 ring-brand-strong' : ''}`}
						>
							<div className="flex flex-wrap items-baseline justify-between gap-2">
								<h2 className="text-lg font-bold">
									{order.restaurant ? (
										<Link
											to={`/restaurants/${order.restaurant}`}
											className="hover:underline"
										>
											{order.restaurantName}
										</Link>
									) : (
										order.restaurantName
									)}
								</h2>
								<time
									dateTime={order.createdAt}
									className="text-sm text-gray-500"
								>
									{formatDateTime(order.createdAt)}
								</time>
							</div>
							<ul className="mt-3 space-y-1 text-sm">
								{order.items.map((item) => (
									<li
										key={item.name}
										className="flex items-center justify-between gap-4"
									>
										<span className="flex items-center gap-2">
											<VegMark isVeg={item.isVeg} />
											{item.quantity} × {item.name}
										</span>
										<span>
											{formatPrice(
												item.price * item.quantity,
											)}
										</span>
									</li>
								))}
							</ul>
							<p className="mt-3 flex justify-between border-t border-gray-100 pt-3 font-bold">
								<span>Total</span>
								<span>{formatPrice(order.total)}</span>
							</p>
						</li>
					))}
				</ul>
			)}
		</>
	);
}
