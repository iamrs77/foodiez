import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
	useCreateDishMutation,
	useGetDishesQuery,
	useUpdateDishMutation,
} from '../../app/api';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import Field from '../../components/Field';
import { SkeletonRows } from '../../components/Loading';
import VegMark from '../../components/VegMark';
import { getErrorMessage, getFieldErrors } from '../../lib/errors';

const TYPES = [
	{ value: true, label: 'Veg' },
	{ value: false, label: 'Non-veg' },
];

// used for both "Add dish" and editing a dish
export default function DishFormPage() {
	const { id: restaurantId, dishId } = useParams();
	const {
		data: dishes,
		isLoading,
		error,
	} = useGetDishesQuery(restaurantId, { skip: !dishId });

	if (dishId && isLoading) {
		return <SkeletonRows count={2} />;
	}
	if (error) {
		return <Alert type="error">{getErrorMessage(error)}</Alert>;
	}

	const dish = dishes?.find((d) => d.id === dishId);
	if (dishId && !dish) {
		return <EmptyState emoji="🍽️" title="Dish not found" />;
	}

	return (
		<DishForm
			key={dish?.id ?? 'new'}
			restaurantId={restaurantId}
			dish={dish}
		/>
	);
}

function DishForm({ restaurantId, dish }) {
	const navigate = useNavigate();
	const isEdit = Boolean(dish);
	const [form, setForm] = useState({
		name: dish?.name ?? '',
		description: dish?.description ?? '',
		price: dish ? String(dish.price) : '',
		isVeg: dish?.isVeg ?? true,
	});
	const [createDish, createState] = useCreateDishMutation();
	const [updateDish, updateState] = useUpdateDishMutation();
	const { isLoading, error } = isEdit ? updateState : createState;
	const fieldErrors = getFieldErrors(error);
	const backTo = `/restaurants/${restaurantId}`;

	const update = (field) => (event) =>
		setForm({ ...form, [field]: event.target.value });

	const handleSubmit = async (event) => {
		event.preventDefault();
		const body = { ...form, price: Number(form.price) };
		try {
			if (isEdit) {
				await updateDish({ id: dish.id, ...body }).unwrap();
			} else {
				await createDish({ restaurantId, ...body }).unwrap();
			}
			navigate(backTo);
		} catch {
			// shown from `error` below
		}
	};

	let submitLabel = isEdit ? 'Save changes' : 'Add dish';
	if (isLoading) {
		submitLabel = 'Saving…';
	}

	return (
		<div className="card mx-auto max-w-xl p-8">
			<h1 className="text-3xl font-bold">
				{isEdit ? `Edit ${dish.name}` : 'Add a dish'}
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
					label="Description"
					htmlFor="description"
					error={fieldErrors.description}
					hint="Optional, up to 300 characters"
				>
					<textarea
						id="description"
						className="input"
						rows={3}
						maxLength={300}
						value={form.description}
						onChange={update('description')}
					/>
				</Field>
				<Field
					label="Price (₹)"
					htmlFor="price"
					error={fieldErrors.price}
				>
					<input
						id="price"
						type="number"
						min="0"
						step="any"
						className="input"
						value={form.price}
						onChange={update('price')}
						required
					/>
				</Field>
				<fieldset className="mt-4">
					<legend className="label">Type</legend>
					<div className="flex gap-3">
						{TYPES.map((type) => (
							<label
								key={type.label}
								className={`card flex cursor-pointer items-center gap-2 px-4 py-2 ${
									form.isVeg === type.value
										? 'ring-2 ring-brand-strong'
										: ''
								}`}
							>
								<input
									type="radio"
									name="isVeg"
									className="sr-only"
									checked={form.isVeg === type.value}
									onChange={() =>
										setForm({ ...form, isVeg: type.value })
									}
								/>
								<VegMark isVeg={type.value} />
								{type.label}
							</label>
						))}
					</div>
				</fieldset>
				<div className="mt-6 flex gap-2">
					<button
						type="submit"
						className="btn btn-primary"
						disabled={isLoading}
					>
						{submitLabel}
					</button>
					<Link to={backTo} className="btn btn-outline">
						Cancel
					</Link>
				</div>
			</form>
		</div>
	);
}
