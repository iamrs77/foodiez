import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router';
import { useRegisterMutation } from '../app/api';
import Alert from '../components/Alert';
import Field from '../components/Field';
import { loggedIn, selectUser } from '../features/auth/authSlice';
import { getErrorMessage, getFieldErrors } from '../lib/errors';

const ROLES = [
	{ value: 'customer', emoji: '😋', title: 'I want to order food' },
	{ value: 'vendor', emoji: '🧑‍🍳', title: 'I run a restaurant' },
];

export default function RegisterPage() {
	const user = useSelector(selectUser);
	const dispatch = useDispatch();
	const [register, { isLoading, error }] = useRegisterMutation();
	const [form, setForm] = useState({
		role: 'customer',
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		passwordConfirm: '',
	});
	const [mismatch, setMismatch] = useState(false);

	if (user) {
		return (
			<Navigate to={user.role === 'vendor' ? '/vendor' : '/'} replace />
		);
	}

	const update = (field) => (event) =>
		setForm({ ...form, [field]: event.target.value });
	const fieldErrors = getFieldErrors(error);

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (form.password !== form.passwordConfirm) {
			setMismatch(true);
			return;
		}
		setMismatch(false);
		const { passwordConfirm: _, ...body } = form;
		try {
			dispatch(loggedIn(await register(body).unwrap()));
		} catch {
			// shown from `error` below
		}
	};

	return (
		<div className="card mx-auto mt-8 max-w-lg p-8 shadow-lg">
			<h1 className="text-3xl font-bold">Create an account</h1>
			<p className="mt-1 text-gray-500">
				Already have one?{' '}
				<Link to="/login" className="font-semibold text-ink underline">
					Log in
				</Link>
			</p>

			{error && (
				<div className="mt-4">
					<Alert type="error">{getErrorMessage(error)}</Alert>
				</div>
			)}

			<form onSubmit={handleSubmit}>
				<fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
					<legend className="label">How will you use Foodiez?</legend>
					{ROLES.map((role) => (
						<label
							key={role.value}
							className={`card flex cursor-pointer items-center gap-3 p-4 transition ${
								form.role === role.value
									? 'border-brand-strong bg-brand/40 ring-2 ring-brand'
									: 'hover:bg-gray-50'
							}`}
						>
							<input
								type="radio"
								name="role"
								value={role.value}
								checked={form.role === role.value}
								onChange={update('role')}
								className="sr-only"
							/>
							<span className="text-2xl" aria-hidden="true">
								{role.emoji}
							</span>
							<span className="font-semibold">{role.title}</span>
						</label>
					))}
				</fieldset>

				<div className="grid gap-x-4 sm:grid-cols-2">
					<Field
						label="First name"
						htmlFor="firstName"
						error={fieldErrors.firstName}
					>
						<input
							id="firstName"
							className="input"
							autoComplete="given-name"
							value={form.firstName}
							onChange={update('firstName')}
							required
						/>
					</Field>
					<Field
						label="Last name"
						htmlFor="lastName"
						error={fieldErrors.lastName}
					>
						<input
							id="lastName"
							className="input"
							autoComplete="family-name"
							value={form.lastName}
							onChange={update('lastName')}
							required
						/>
					</Field>
				</div>
				<Field label="Email" htmlFor="email" error={fieldErrors.email}>
					<input
						id="email"
						type="email"
						className="input"
						autoComplete="email"
						value={form.email}
						onChange={update('email')}
						required
					/>
				</Field>
				<Field
					label="Password"
					htmlFor="password"
					error={fieldErrors.password}
					hint="At least 8 characters"
				>
					<input
						id="password"
						type="password"
						className="input"
						autoComplete="new-password"
						minLength={8}
						value={form.password}
						onChange={update('password')}
						required
					/>
				</Field>
				<Field
					label="Confirm password"
					htmlFor="passwordConfirm"
					error={mismatch ? "Passwords don't match" : null}
				>
					<input
						id="passwordConfirm"
						type="password"
						className="input"
						autoComplete="new-password"
						value={form.passwordConfirm}
						onChange={update('passwordConfirm')}
						required
					/>
				</Field>

				<button
					type="submit"
					className="btn btn-primary mt-6 w-full py-3"
					disabled={isLoading}
				>
					{isLoading ? 'Creating account…' : 'Create account'}
				</button>
			</form>
		</div>
	);
}
