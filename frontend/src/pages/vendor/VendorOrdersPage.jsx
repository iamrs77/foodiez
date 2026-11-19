import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
	useGetVendorOrdersQuery,
	useUpdateOrderStatusMutation,
} from '../../app/api';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import { SkeletonRows } from '../../components/Loading';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import VegMark from '../../components/VegMark';
import { getErrorMessage } from '../../lib/errors';
import { formatDateTime, formatPrice, formatTimeAgo } from '../../lib/format';
import { ORDER_POLL_MS, VENDOR_ACTIONS } from '../../lib/orderStatus';

const VIEWS = [
	{ value: 'active', label: 'To do' },
	{ value: 'past', label: 'Done' },
];

function VendorOrder({ order }) {
	const [updateStatus, { isLoading, error, originalArgs }] =
		useUpdateOrderStatusMutation();
	const [failed, setFailed] = useState(null);

	const move = async (status, label) => {
		if (status === 'cancelled' && !window.confirm(`${label} this order?`)) {
			return;
		}
		setFailed(null);
		try {
			await updateStatus({ id: order.id, status }).unwrap();
		} catch {
			setFailed(status);
		}
	};

	return (
		<li className="card p-5">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="text-lg font-bold">
					{order.customerName}{' '}
					<span className="font-normal text-gray-500">
						· {order.restaurantName}
					</span>
				</h2>
				<OrderStatusBadge status={order.status} />
			</div>
			<p className="mt-1 text-sm text-gray-500">
				<time
					dateTime={order.createdAt}
					title={formatDateTime(order.createdAt)}
				>
					Ordered {formatTimeAgo(order.createdAt)}
				</time>
			</p>

			<div className="mt-4 grid gap-4 sm:grid-cols-2">
				<div>
					<ul className="space-y-1 text-sm">
						{order.items.map((item) => (
							<li
								key={item.name}
								className="flex items-center gap-2"
							>
								<VegMark isVeg={item.isVeg} />
								<strong>{item.quantity} ×</strong> {item.name}
							</li>
						))}
					</ul>
					<p className="mt-2 font-bold">{formatPrice(order.total)}</p>
				</div>
				<div className="text-sm">
					<p className="font-semibold">Deliver to</p>
					<p className="whitespace-pre-line">
						{order.delivery.address}
					</p>
					<p className="text-gray-500">{order.delivery.phone}</p>
					{order.delivery.note && (
						<p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-amber-900">
							Note: {order.delivery.note}
						</p>
					)}
				</div>
			</div>

			{VENDOR_ACTIONS[order.status].length > 0 && (
				<div className="mt-4 flex flex-wrap gap-2">
					{VENDOR_ACTIONS[order.status].map(([status, label]) => (
						<button
							key={status}
							type="button"
							className={`btn ${status === 'cancelled' ? 'btn-outline' : 'btn-primary'}`}
							onClick={() => move(status, label)}
							disabled={isLoading}
						>
							{isLoading && originalArgs?.status === status
								? 'Saving…'
								: label}
						</button>
					))}
				</div>
			)}
			{error && failed && (
				<div className="mt-3">
					<Alert type="error">{getErrorMessage(error)}</Alert>
				</div>
			)}
		</li>
	);
}

// the orders for the vendor's restaurants: what to do next, and what's done.
// New orders appear by themselves.
export default function VendorOrdersPage() {
	const [params, setParams] = useSearchParams();
	const view = params.get('view') === 'past' ? 'past' : 'active';
	const {
		data: orders,
		isLoading,
		error,
	} = useGetVendorOrdersQuery(view, {
		pollingInterval: view === 'active' ? ORDER_POLL_MS : 0,
		skipPollingIfUnfocused: true,
	});

	let content;
	if (isLoading) {
		content = <SkeletonRows />;
	} else if (error) {
		content = <Alert type="error">{getErrorMessage(error)}</Alert>;
	} else if (orders.length === 0) {
		content =
			view === 'active' ? (
				<EmptyState emoji="🛎️" title="No orders waiting">
					New orders show up here by themselves.
				</EmptyState>
			) : (
				<EmptyState emoji="🧾" title="Nothing here yet">
					Delivered and cancelled orders show up here.
				</EmptyState>
			);
	} else {
		content = (
			<ul className="space-y-4">
				{orders.map((order) => (
					<VendorOrder key={order.id} order={order} />
				))}
			</ul>
		);
	}

	return (
		<>
			<h1 className="text-3xl font-bold">Orders</h1>
			<div className="mt-4 mb-6 flex gap-2" role="tablist">
				{VIEWS.map((v) => (
					<button
						key={v.value}
						type="button"
						role="tab"
						aria-selected={view === v.value}
						className={`btn ${view === v.value ? 'bg-brand' : 'btn-outline'}`}
						onClick={() =>
							setParams(
								v.value === 'past' ? { view: 'past' } : {},
								{
									replace: true,
								},
							)
						}
					>
						{v.label}
					</button>
				))}
			</div>
			{content}
		</>
	);
}
