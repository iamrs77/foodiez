import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
	useCreateRestaurantMutation,
	useGetRestaurantQuery,
	useUpdateRestaurantMutation,
} from '../../app/api';
import Alert from '../../components/Alert';
import Field from '../../components/Field';
import { SkeletonRows } from '../../components/Loading';
import { getErrorMessage, getFieldErrors } from '../../lib/errors';

const EMPTY = {
	name: '',
	cuisine: '',
	location: '',
	priceForTwo: '',
	deliveryTimeMinutes: '',
};

// used for both "Add restaurant" and "Edit details"
export default function RestaurantFormPage() {
	const { id } = useParams();
	const {
		data: restaurant,
		isLoading,
		error,
	} = useGetRestaurantQuery(id, { skip: !id });

	if (id && isLoading) {
		return <SkeletonRows count={2} />;
	}
	if (error) {
		return <Alert type="error">{getErrorMessage(error)}</Alert>;
	}

	// the key resets the form once the restaurant has loaded
	return (
		<RestaurantForm key={restaurant?.id ?? 'new'} restaurant={restaurant} />
	);
}

function RestaurantForm({ restaurant }) {
	const navigate = useNavigate();
	const isEdit = Boolean(restaurant);
	const [form, setForm] = useState(() =>
		restaurant
			? {
					name: restaurant.name,
					cuisine: restaurant.cuisine,
					location: restaurant.location,
					priceForTwo: String(restaurant.priceForTwo),
					deliveryTimeMinutes: String(restaurant.deliveryTimeMinutes),
				}
			: EMPTY,
	);
	const [createRestaurant, createState] = useCreateRestaurantMutation();
	const [updateRestaurant, updateState] = useUpdateRestaurantMutation();
	const { isLoading, error } = isEdit ? updateState : createState;
	const fieldErrors = getFieldErrors(error);

	const update = (field) => (event) =>
		setForm({ ...form, [field]: event.target.value });

	const handleSubmit = async (event) => {
		event.preventDefault();
		const body = {
			...form,
			priceForTwo: Number(form.priceForTwo),
			deliveryTimeMinutes: Number(form.deliveryTimeMinutes),
		};
		try {
			const saved = isEdit
				? await updateRestaurant({
						id: restaurant.id,
						...body,
					}).unwrap()
				: await createRestaurant(body).unwrap();
			navigate(`/restaurants/${saved.id}`);
		} catch {
			// shown from `error` below
		}
	};

	let submitLabel = isEdit ? 'Save changes' : 'Add restaurant';
	if (isLoading) {
		submitLabel = 'Saving…';
	}

	return (
		<div className="card mx-auto max-w-xl p-8">
			<h1 className="text-3xl font-bold">
				{isEdit ? `Edit ${restaurant.name}` : 'Add a restaurant'}
			</h1>
			{error && (
				<div className="mt-4">
					<Alert type="error">{getErrorMessage(error)}</Alert>
				</div>
			)}
			<form onSubmit={handleSubmit}>
				<Field label="Name" htmlFor="name" error={fieldErrors.name}>
					<input
						id="name"
						className="input"
						value={form.name}
						onChange={update('name')}
						required
					/>
				</Field>
				<Field
					label="Cuisine"
					htmlFor="cuisine"
					error={fieldErrors.cuisine}
					hint="For example: North Indian, Pizza, Chinese"
				>
					<input
						id="cuisine"
						className="input"
						value={form.cuisine}
						onChange={update('cuisine')}
						required
					/>
				</Field>
				<Field
					label="Location"
					htmlFor="location"
					error={fieldErrors.location}
					hint="For example: HSR Layout, Bengaluru"
				>
					<input
						id="location"
						className="input"
						value={form.location}
						onChange={update('location')}
						required
					/>
				</Field>
				<div className="grid gap-x-4 sm:grid-cols-2">
					<Field
						label="Price for two (₹)"
						htmlFor="priceForTwo"
						error={fieldErrors.priceForTwo}
					>
						<input
							id="priceForTwo"
							type="number"
							min="0"
							step="1"
							className="input"
							value={form.priceForTwo}
							onChange={update('priceForTwo')}
							required
						/>
					</Field>
					<Field
						label="Delivery time (minutes)"
						htmlFor="deliveryTimeMinutes"
						error={fieldErrors.deliveryTimeMinutes}
					>
						<input
							id="deliveryTimeMinutes"
							type="number"
							min="5"
							max="180"
							step="1"
							className="input"
							value={form.deliveryTimeMinutes}
							onChange={update('deliveryTimeMinutes')}
							required
						/>
					</Field>
				</div>
				<div className="mt-6 flex gap-2">
					<button
						type="submit"
						className="btn btn-primary"
						disabled={isLoading}
					>
						{submitLabel}
					</button>
					<Link
						to={
							isEdit ? `/restaurants/${restaurant.id}` : '/vendor'
						}
						className="btn btn-outline"
					>
						Cancel
					</Link>
				</div>
			</form>
		</div>
	);
}
