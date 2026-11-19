import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { startSession, useStartDemoMutation } from '../app/api';
import { getErrorMessage } from '../lib/errors';
import { useSiteConfig } from '../lib/useSiteConfig';
import Alert from './Alert';

const ROLES = [
	{ as: 'customer', label: '😋 Try as a customer', home: '/' },
	{ as: 'vendor', label: '🧑‍🍳 Try as a restaurant owner', home: '/vendor' },
];

// "Try the demo": the visitor gets a private copy of the demo restaurants and
// accounts, with no sign-up, and is logged in to it
export default function TryDemo({ className = '' }) {
	const { demoEnabled, demoHours } = useSiteConfig();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [startDemo, { isLoading, originalArgs, error }] =
		useStartDemoMutation();

	if (!demoEnabled) {
		return null;
	}

	const start = async ({ as, home }) => {
		try {
			dispatch(startSession(await startDemo(as).unwrap()));
			navigate(home);
		} catch {
			// shown from `error` below
		}
	};

	return (
		<section
			aria-labelledby="try-demo-heading"
			className={`rounded-2xl border border-brand-strong/40 bg-brand/30 p-5 ${className}`}
		>
			<h2 id="try-demo-heading" className="text-lg font-bold">
				Try the demo
			</h2>
			<p className="mt-1 text-sm text-gray-600">
				Get your own copy of five restaurants, with menus and past
				orders. No sign-up. Change anything you like: nobody else sees
				it, and it's deleted after {demoHours} hours.
			</p>
			<div className="mt-4 flex flex-wrap gap-2">
				{ROLES.map((role) => (
					<button
						key={role.as}
						type="button"
						className={`btn ${role.as === 'customer' ? 'btn-primary' : 'btn-outline'}`}
						onClick={() => start(role)}
						disabled={isLoading}
					>
						{isLoading && originalArgs === role.as
							? 'Setting up your demo…'
							: role.label}
					</button>
				))}
			</div>
			{error && (
				<div className="mt-4">
					<Alert type="error">{getErrorMessage(error)}</Alert>
				</div>
			)}
		</section>
	);
}
