import { Link } from 'react-router';
import { useGetOrdersQuery } from '../app/api';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { SkeletonRows } from '../components/Loading';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { getErrorMessage } from '../lib/errors';
import { formatDateTime, formatPrice } from '../lib/format';

export default function OrdersPage() {
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
						<li key={order.id}>
							<Link
								to={`/orders/${order.id}`}
								className="card block p-5 transition hover:shadow-md"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<h2 className="text-lg font-bold">
										{order.restaurantName}
									</h2>
									<OrderStatusBadge status={order.status} />
								</div>
								<p className="mt-1 text-sm text-gray-500">
									<time dateTime={order.createdAt}>
										{formatDateTime(order.createdAt)}
									</time>{' '}
									·{' '}
									{order.items
										.map(
											(item) =>
												`${item.quantity} × ${item.name}`,
										)
										.join(', ')}
								</p>
								<p className="mt-3 flex justify-between border-t border-gray-100 pt-3 font-bold">
									<span>Total</span>
									<span>{formatPrice(order.total)}</span>
								</p>
							</Link>
						</li>
					))}
				</ul>
			)}
		</>
	);
}
