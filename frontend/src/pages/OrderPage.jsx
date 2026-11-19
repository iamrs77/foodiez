import { CircleCheck, CircleDot, CircleX } from 'lucide-react';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useParams } from 'react-router';
import { api, useCancelOrderMutation, useGetOrderQuery } from '../app/api';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { SkeletonRows } from '../components/Loading';
import OrderStatusBadge from '../components/OrderStatusBadge';
import VegMark from '../components/VegMark';
import { getErrorMessage } from '../lib/errors';
import { formatDateTime, formatPrice, formatTime } from '../lib/format';
import { isActive, ORDER_POLL_MS, ORDER_STEPS } from '../lib/orderStatus';

// one order, with where it's got to; refreshes by itself until it's delivered
// or cancelled, so the customer can watch the restaurant accept and prepare it
export default function OrderPage() {
	const { id } = useParams();
	const location = useLocation();

	// keep checking only while the order is still on its way
	const selectCached = useMemo(() => api.endpoints.getOrder.select(id), [id]);
	const cached = useSelector(selectCached).data;
	const polling = !cached || isActive(cached.status);
	const {
		data: order,
		isLoading,
		error,
	} = useGetOrderQuery(id, {
		pollingInterval: polling ? ORDER_POLL_MS : 0,
		skipPollingIfUnfocused: true,
	});
	const [cancelOrder, { isLoading: isCancelling, error: cancelError }] =
		useCancelOrderMutation();

	if (isLoading) {
		return <SkeletonRows />;
	}
	if (error?.status === 404) {
		return (
			<EmptyState emoji="🧾" title="Order not found">
				<Link to="/orders" className="btn btn-primary mt-6">
					Your orders
				</Link>
			</EmptyState>
		);
	}
	if (error) {
		return <Alert type="error">{getErrorMessage(error)}</Alert>;
	}

	const reachedAt = new Map(order.statusHistory.map((s) => [s.status, s.at]));
	const cancelledAt = reachedAt.get('cancelled');

	const handleCancel = async () => {
		if (window.confirm('Cancel this order?')) {
			try {
				await cancelOrder(order.id).unwrap();
			} catch {
				// shown from `cancelError` below
			}
		}
	};

	return (
		<div className="mx-auto max-w-2xl">
			<Link
				to="/orders"
				className="text-sm text-gray-500 hover:underline"
			>
				← Your orders
			</Link>
			<div className="mt-2 flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-3xl font-bold">
					Order from {order.restaurantName}
				</h1>
				<OrderStatusBadge status={order.status} />
			</div>
			<p className="mt-1 text-sm text-gray-500">
				Placed {formatDateTime(order.createdAt)}
			</p>

			<div className="mt-6 space-y-3">
				{location.state?.justPlaced && (
					<Alert type="success">
						Order placed! The restaurant will accept it shortly, and
						this page updates by itself.
					</Alert>
				)}
				{cancelError && (
					<Alert type="error">{getErrorMessage(cancelError)}</Alert>
				)}
			</div>

			<section className="card mt-6 p-6" aria-labelledby="progress">
				<h2 id="progress" className="font-bold">
					Progress
				</h2>
				{cancelledAt ? (
					<p className="mt-4 flex items-center gap-2 text-gray-700">
						<CircleX size={20} className="text-red-700" />
						Cancelled at {formatTime(cancelledAt)}
					</p>
				) : (
					<ol className="mt-4 space-y-3">
						{ORDER_STEPS.map((step) => {
							const at = reachedAt.get(step.status);
							const current = step.status === order.status;
							return (
								<li
									key={step.status}
									className={`flex items-center gap-3 ${at ? '' : 'text-gray-400'}`}
									aria-current={current ? 'step' : undefined}
								>
									{at && !current && (
										<CircleCheck
											size={20}
											className="text-green-700"
										/>
									)}
									{current && (
										<CircleDot
											size={20}
											className="text-amber-600"
										/>
									)}
									{!at && (
										<span className="size-5 rounded-full border-2 border-gray-300" />
									)}
									<span
										className={
											current ? 'font-semibold' : ''
										}
									>
										{step.label}
									</span>
									{at && (
										<time
											dateTime={at}
											className="ml-auto text-sm text-gray-500"
										>
											{formatTime(at)}
										</time>
									)}
								</li>
							);
						})}
					</ol>
				)}
				{order.status === 'placed' && (
					<button
						type="button"
						className="btn btn-outline mt-6"
						onClick={handleCancel}
						disabled={isCancelling}
					>
						{isCancelling ? 'Cancelling…' : 'Cancel order'}
					</button>
				)}
			</section>

			<section className="card mt-6 p-6" aria-labelledby="items">
				<h2 id="items" className="font-bold">
					Items
				</h2>
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
								{formatPrice(item.price * item.quantity)}
							</span>
						</li>
					))}
				</ul>
				<p className="mt-3 flex justify-between border-t border-gray-100 pt-3 font-bold">
					<span>Total</span>
					<span>{formatPrice(order.total)}</span>
				</p>
			</section>

			<section className="card mt-6 p-6" aria-labelledby="delivery">
				<h2 id="delivery" className="font-bold">
					Delivering to
				</h2>
				<p className="mt-2 whitespace-pre-line">
					{order.delivery.address}
				</p>
				<p className="mt-1 text-sm text-gray-500">
					{order.delivery.phone}
				</p>
				{order.delivery.note && (
					<p className="mt-2 text-sm">Note: {order.delivery.note}</p>
				)}
			</section>
		</div>
	);
}
