import { ArrowLeft, Clock, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router';
import {
	useAddToCartMutation,
	useClearCartMutation,
	useDeleteDishMutation,
	useDeleteRestaurantMutation,
	useGetCartQuery,
	useGetDishesQuery,
	useGetRestaurantQuery,
	useRemoveCartItemMutation,
	useUpdateCartItemMutation,
} from '../app/api';
import Alert from '../components/Alert';
import CuisineTile from '../components/CuisineTile';
import EmptyState from '../components/EmptyState';
import { SkeletonRows } from '../components/Loading';
import QuantityStepper from '../components/QuantityStepper';
import VegMark from '../components/VegMark';
import { selectUser } from '../features/auth/authSlice';
import { getErrorMessage } from '../lib/errors';
import { formatPrice } from '../lib/format';

export default function RestaurantPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const user = useSelector(selectUser);
	const isCustomer = user?.role === 'customer';

	const restaurantQuery = useGetRestaurantQuery(id);
	const dishesQuery = useGetDishesQuery(id);
	const { data: cart } = useGetCartQuery(undefined, { skip: !isCustomer });

	const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
	const [updateCartItem] = useUpdateCartItemMutation();
	const [removeCartItem] = useRemoveCartItemMutation();
	const [clearCart] = useClearCartMutation();
	const [deleteRestaurant] = useDeleteRestaurantMutation();
	const [deleteDish] = useDeleteDishMutation();

	// a dish that couldn't be added because the cart has another restaurant's food
	const [conflict, setConflict] = useState(null);
	const [actionError, setActionError] = useState(null);

	const restaurant = restaurantQuery.data;
	const isOwner = user?.role === 'vendor' && restaurant?.owner === user.id;
	const cartHere = cart?.restaurant?.id === id ? cart : null;
	const cartCount =
		cartHere?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

	if (restaurantQuery.error) {
		return restaurantQuery.error.status === 404 ||
			restaurantQuery.error.status === 400 ? (
			<EmptyState emoji="🍽️" title="Restaurant not found">
				<Link to="/" className="btn btn-primary mt-4">
					See all restaurants
				</Link>
			</EmptyState>
		) : (
			<Alert type="error">{getErrorMessage(restaurantQuery.error)}</Alert>
		);
	}
	if (restaurantQuery.isLoading) {
		return <SkeletonRows />;
	}

	const run = async (action) => {
		setActionError(null);
		try {
			await action();
		} catch (err) {
			setActionError(getErrorMessage(err));
		}
	};

	const handleAdd = async (dish) => {
		if (!user) {
			navigate('/login', { state: { from: `/restaurants/${id}` } });
			return;
		}
		setActionError(null);
		setConflict(null);

		// ask right away if the cart has another restaurant's food
		// (the API refuses it too, which the catch below handles)
		if (cart?.restaurant && cart.restaurant.id !== id) {
			setConflict({
				dish,
				message: `Your cart has dishes from ${cart.restaurant.name}. Empty your cart to order from another restaurant.`,
			});
			return;
		}

		try {
			await addToCart({ dishId: dish.id }).unwrap();
		} catch (err) {
			if (err.status === 409) {
				setConflict({ dish, message: getErrorMessage(err) });
			} else {
				setActionError(getErrorMessage(err));
			}
		}
	};

	const handleQuantity = (item, quantity) =>
		run(() =>
			quantity === 0
				? removeCartItem(item.id).unwrap()
				: updateCartItem({ id: item.id, quantity }).unwrap(),
		);

	const startNewCart = () =>
		run(async () => {
			await clearCart().unwrap();
			await addToCart({ dishId: conflict.dish.id }).unwrap();
			setConflict(null);
		});

	const handleDeleteRestaurant = () => {
		if (window.confirm(`Delete ${restaurant.name} and its whole menu?`)) {
			run(async () => {
				await deleteRestaurant(id).unwrap();
				navigate('/vendor');
			});
		}
	};

	const handleDeleteDish = (dish) => {
		if (window.confirm(`Delete ${dish.name} from the menu?`)) {
			run(() => deleteDish(dish.id).unwrap());
		}
	};

	const dishes = dishesQuery.data ?? [];

	return (
		<>
			<Link
				to="/"
				className="mb-6 inline-flex items-center gap-1 text-sm hover:underline"
			>
				<ArrowLeft size={16} /> All restaurants
			</Link>

			<section className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
				<CuisineTile cuisine={restaurant.cuisine} />
				<div className="flex-1">
					<h1 className="text-3xl font-bold uppercase">
						{restaurant.name}
					</h1>
					<p className="mt-1 text-gray-600">{restaurant.cuisine}</p>
					<p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
						<MapPin size={14} /> {restaurant.location}
					</p>
					<p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
						<span className="flex items-center gap-1">
							<Clock size={14} /> {restaurant.deliveryTimeMinutes}{' '}
							mins
						</span>
						<span>
							{formatPrice(restaurant.priceForTwo)} for two
						</span>
					</p>
				</div>
				{isOwner && (
					<div className="flex flex-wrap gap-2 sm:flex-col">
						<Link
							to={`/vendor/restaurants/${id}/dishes/new`}
							className="btn btn-primary"
						>
							<Plus size={16} /> Add dish
						</Link>
						<Link
							to={`/vendor/restaurants/${id}/edit`}
							className="btn btn-outline"
						>
							<Pencil size={16} /> Edit details
						</Link>
						<button
							type="button"
							className="btn btn-danger"
							onClick={handleDeleteRestaurant}
						>
							<Trash2 size={16} /> Delete
						</button>
					</div>
				)}
			</section>

			<div className="mt-6 space-y-3">
				{conflict && (
					<Alert
						type="info"
						action={
							<div className="flex gap-2">
								<button
									type="button"
									className="btn btn-primary"
									onClick={startNewCart}
								>
									Empty cart and add
								</button>
								<button
									type="button"
									className="btn btn-outline"
									onClick={() => setConflict(null)}
								>
									Keep my cart
								</button>
							</div>
						}
					>
						{conflict.message}
					</Alert>
				)}
				{actionError && <Alert type="error">{actionError}</Alert>}
			</div>

			<h2 className="mt-8 mb-4 text-2xl font-bold">Menu</h2>
			{dishesQuery.isLoading && <SkeletonRows />}
			{dishesQuery.error && (
				<Alert type="error">{getErrorMessage(dishesQuery.error)}</Alert>
			)}
			{dishesQuery.isSuccess && dishes.length === 0 && (
				<EmptyState emoji="🧑‍🍳" title="No dishes yet">
					{isOwner
						? 'Add your first dish so customers can order.'
						: 'This restaurant is still setting up its menu.'}
				</EmptyState>
			)}

			<ul className="space-y-4">
				{dishes.map((dish) => {
					const cartItem = cartHere?.items.find(
						(item) => item.dish.id === dish.id,
					);
					return (
						<li
							key={dish.id}
							className="card flex items-center justify-between gap-4 p-5"
						>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<VegMark isVeg={dish.isVeg} />
									<h3 className="text-lg font-bold">
										{dish.name}
									</h3>
								</div>
								<p className="mt-1 font-semibold">
									{formatPrice(dish.price)}
								</p>
								{dish.description && (
									<p className="mt-1 text-sm text-gray-500">
										{dish.description}
									</p>
								)}
							</div>

							<div className="shrink-0">
								{isOwner && (
									<div className="flex gap-2">
										<Link
											to={`/vendor/restaurants/${id}/dishes/${dish.id}/edit`}
											className="btn btn-outline px-3"
											aria-label={`Edit ${dish.name}`}
										>
											<Pencil size={16} />
										</Link>
										<button
											type="button"
											className="btn btn-danger px-3"
											onClick={() =>
												handleDeleteDish(dish)
											}
											aria-label={`Delete ${dish.name}`}
										>
											<Trash2 size={16} />
										</button>
									</div>
								)}
								{(!user || isCustomer) &&
									(cartItem ? (
										<QuantityStepper
											quantity={cartItem.quantity}
											onChange={(quantity) =>
												handleQuantity(
													cartItem,
													quantity,
												)
											}
										/>
									) : (
										<button
											type="button"
											className="btn btn-primary"
											onClick={() => handleAdd(dish)}
											disabled={isAdding}
										>
											<Plus size={16} /> Add
										</button>
									))}
							</div>
						</li>
					);
				})}
			</ul>

			{cartCount > 0 && (
				<div className="sticky bottom-4 mt-8">
					<Link
						to="/cart"
						className="btn btn-primary w-full justify-between py-3 text-base shadow-lg"
					>
						<span>
							{cartCount} {cartCount === 1 ? 'item' : 'items'} ·{' '}
							{formatPrice(cartHere.total)}
						</span>
						<span>View cart →</span>
					</Link>
				</div>
			)}
		</>
	);
}
