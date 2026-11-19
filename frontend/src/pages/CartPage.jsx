import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
	useGetCartQuery,
	useGetOrdersQuery,
	usePlaceOrderMutation,
	useRemoveCartItemMutation,
	useUpdateCartItemMutation,
} from '../app/api';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Field from '../components/Field';
import { SkeletonRows } from '../components/Loading';
import QuantityStepper from '../components/QuantityStepper';
import VegMark from '../components/VegMark';
import { getErrorMessage, getFieldErrors } from '../lib/errors';
import { formatPrice } from '../lib/format';

export default function CartPage() {
	const navigate = useNavigate();
	const { data: cart, isLoading, error } = useGetCartQuery();
	const [placeOrder, { isLoading: isPlacing, error: placeError }] =
		usePlaceOrderMutation();
	// the last order's address and phone, so a regular doesn't type them again
	const { data: orders } = useGetOrdersQuery();
	const [delivery, setDelivery] = useState(null);
	// one key per checkout: clicking again after a timeout retries the same
	// order instead of placing a second one
	const idempotencyKey = useRef(null);
	const [updateCartItem] = useUpdateCartItemMutation();
	const [removeCartItem] = useRemoveCartItemMutation();
	const [actionError, setActionError] = useState(null);

	if (isLoading) {
		return <SkeletonRows />;
	}
	if (error) {
		return <Alert type="error">{getErrorMessage(error)}</Alert>;
	}

	if (cart.items.length === 0) {
		return (
			<EmptyState emoji="🛒" title="Your cart is empty">
				<p>Add some dishes from a restaurant's menu.</p>
				<div className="mt-6 flex justify-center gap-2">
					<Link to="/" className="btn btn-primary">
						Browse restaurants
					</Link>
					<Link to="/orders" className="btn btn-outline">
						Your orders
					</Link>
				</div>
			</EmptyState>
		);
	}

	const run = async (action) => {
		setActionError(null);
		try {
			await action();
		} catch (err) {
			setActionError(getErrorMessage(err));
		}
	};

	const changeQuantity = (item, quantity) =>
		run(() =>
			quantity === 0
				? removeCartItem(item.id).unwrap()
				: updateCartItem({ id: item.id, quantity }).unwrap(),
		);

	const last = orders?.[0]?.delivery;
	const form = delivery ?? {
		address: last?.address ?? '',
		phone: last?.phone ?? '',
		note: '',
	};
	const update = (field) => (event) =>
		setDelivery({ ...form, [field]: event.target.value });
	const fieldErrors = getFieldErrors(placeError);

	const handlePlaceOrder = async (event) => {
		event.preventDefault();
		idempotencyKey.current ??= crypto.randomUUID();
		try {
			const order = await placeOrder({
				delivery: form,
				idempotencyKey: idempotencyKey.current,
			}).unwrap();
			idempotencyKey.current = null;
			navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
		} catch {
			// shown from `placeError` below
		}
	};

	return (
		<div className="grid items-start gap-8 md:grid-cols-[1fr_320px]">
			<section>
				<h1 className="text-3xl font-bold">Your cart</h1>
				<p className="mt-1 text-gray-500">
					From{' '}
					<Link
						to={`/restaurants/${cart.restaurant.id}`}
						className="font-semibold text-ink underline"
					>
						{cart.restaurant.name}
					</Link>
				</p>

				{actionError && (
					<div className="mt-4">
						<Alert type="error">{actionError}</Alert>
					</div>
				)}

				<ul className="mt-6 space-y-4">
					{cart.items.map((item) => (
						<li
							key={item.id}
							className="card flex flex-wrap items-center gap-4 p-5"
						>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<VegMark isVeg={item.dish.isVeg} />
									<h2 className="font-bold">
										{item.dish.name}
									</h2>
								</div>
								<p className="mt-1 text-sm text-gray-500">
									{formatPrice(item.dish.price)} each
								</p>
							</div>
							<QuantityStepper
								quantity={item.quantity}
								onChange={(quantity) =>
									changeQuantity(item, quantity)
								}
							/>
							<span className="w-20 text-right font-semibold">
								{formatPrice(item.dish.price * item.quantity)}
							</span>
							<button
								type="button"
								className="cursor-pointer rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-700"
								onClick={() => changeQuantity(item, 0)}
								aria-label={`Remove ${item.dish.name}`}
							>
								<Trash2 size={18} />
							</button>
						</li>
					))}
				</ul>
			</section>

			<aside className="card sticky top-24 p-6 shadow-md">
				<h2 className="font-bold">Bill details</h2>
				<dl className="mt-4 space-y-3 text-sm">
					<div className="flex justify-between">
						<dt>Item total</dt>
						<dd>{formatPrice(cart.total)}</dd>
					</div>
					<div className="flex justify-between text-gray-500">
						<dt>Delivery fee</dt>
						<dd>Free</dd>
					</div>
					<div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold">
						<dt>To pay</dt>
						<dd>{formatPrice(cart.total)}</dd>
					</div>
				</dl>
				<form
					onSubmit={handlePlaceOrder}
					className="mt-6 border-t border-gray-200 pt-4"
				>
					<h2 className="font-bold">Deliver to</h2>
					{placeError &&
						!fieldErrors['delivery.address'] &&
						!fieldErrors['delivery.phone'] && (
							<div className="mt-3">
								<Alert type="error">
									{getErrorMessage(placeError)}
								</Alert>
							</div>
						)}
					<Field
						label="Address"
						htmlFor="address"
						error={fieldErrors['delivery.address']}
					>
						<textarea
							id="address"
							className="input"
							rows={3}
							autoComplete="street-address"
							value={form.address}
							onChange={update('address')}
							required
						/>
					</Field>
					<Field
						label="Phone"
						htmlFor="phone"
						error={fieldErrors['delivery.phone']}
					>
						<input
							id="phone"
							type="tel"
							className="input"
							autoComplete="tel"
							value={form.phone}
							onChange={update('phone')}
							required
						/>
					</Field>
					<Field
						label="Note for the restaurant"
						htmlFor="note"
						hint="Optional, e.g. ring the bell twice"
						error={fieldErrors['delivery.note']}
					>
						<input
							id="note"
							className="input"
							maxLength={200}
							value={form.note}
							onChange={update('note')}
						/>
					</Field>
					<button
						type="submit"
						className="btn btn-primary mt-6 w-full py-3"
						disabled={isPlacing}
					>
						{isPlacing
							? 'Placing order…'
							: `Place order · ${formatPrice(cart.total)}`}
					</button>
				</form>
				<Link to="/orders" className="btn btn-outline mt-3 w-full">
					Your orders
				</Link>
			</aside>
		</div>
	);
}
