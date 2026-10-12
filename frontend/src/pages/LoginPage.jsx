import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useLocation } from 'react-router';
import { useLoginMutation } from '../app/api';
import Alert from '../components/Alert';
import Field from '../components/Field';
import { loggedIn, selectUser } from '../features/auth/authSlice';
import { getErrorMessage } from '../lib/errors';

// the accounts created by the backend's demo data
const DEMO_ACCOUNTS = [
	{ label: 'Demo customer', email: 'customer@foodiez.dev' },
	{ label: 'Demo vendor', email: 'vendor@foodiez.dev' },
];
const DEMO_PASSWORD = 'password123';

export default function LoginPage() {
	const user = useSelector(selectUser);
	const dispatch = useDispatch();
	const location = useLocation();
	const [form, setForm] = useState({ email: '', password: '' });
	const [login, { isLoading, error }] = useLoginMutation();

	// once logged in, go back to the page that asked for a login, or to the right home page
	if (user) {
		const home = user.role === 'vendor' ? '/vendor' : '/';
		return <Navigate to={location.state?.from ?? home} replace />;
	}

	const update = (field) => (event) =>
		setForm({ ...form, [field]: event.target.value });

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			dispatch(loggedIn(await login(form).unwrap()));
		} catch {
			// shown from `error` below
		}
	};

	return (
		<div className="card mx-auto mt-8 max-w-md p-8 shadow-lg">
			<h1 className="text-3xl font-bold">Log in</h1>
			<p className="mt-1 text-gray-500">
				New here?{' '}
				<Link
					to="/register"
					className="font-semibold text-ink underline"
				>
					Create an account
				</Link>
			</p>

			{error && (
				<div className="mt-4">
					<Alert type="error">{getErrorMessage(error)}</Alert>
				</div>
			)}

			<form onSubmit={handleSubmit}>
				<Field label="Email" htmlFor="email">
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
				<Field label="Password" htmlFor="password">
					<input
						id="password"
						type="password"
						className="input"
						autoComplete="current-password"
						value={form.password}
						onChange={update('password')}
						required
					/>
				</Field>
				<button
					type="submit"
					className="btn btn-primary mt-6 w-full py-3"
					disabled={isLoading}
				>
					{isLoading ? 'Logging in…' : 'Log in'}
				</button>
			</form>

			<div className="mt-6 rounded-xl bg-page p-4 text-sm">
				<p className="font-semibold">Just looking around?</p>
				<p className="text-gray-500">
					Fill in a demo account (password {DEMO_PASSWORD}):
				</p>
				<div className="mt-2 flex flex-wrap gap-2">
					{DEMO_ACCOUNTS.map((account) => (
						<button
							key={account.email}
							type="button"
							className="btn btn-outline"
							onClick={() =>
								setForm({
									email: account.email,
									password: DEMO_PASSWORD,
								})
							}
						>
							{account.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
