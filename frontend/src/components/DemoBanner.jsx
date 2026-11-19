import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { startSession, useSwitchDemoRoleMutation } from '../app/api';
import { selectUser } from '../features/auth/authSlice';
import { getErrorMessage } from '../lib/errors';

const HOUR = 60 * 60 * 1000;

// "in about 23 hours", or "within the hour" near the end
function timeLeft(expiresAt) {
	const hours = Math.round((new Date(expiresAt) - Date.now()) / HOUR);
	if (hours < 1) {
		return 'within the hour';
	}
	return `in about ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

// shown while the visitor is in their private demo; they can switch between
// the restaurant owner and the customer of the same demo
export default function DemoBanner() {
	const user = useSelector(selectUser);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [switchRole, { isLoading, error }] = useSwitchDemoRoleMutation();

	// only demo accounts expire
	if (!user?.expiresAt) {
		return null;
	}

	const other = user.role === 'vendor' ? 'customer' : 'restaurant owner';
	const handleSwitch = async () => {
		try {
			const session = await switchRole().unwrap();
			dispatch(startSession(session));
			navigate(session.user.role === 'vendor' ? '/vendor' : '/');
		} catch {
			// shown from `error` below
		}
	};

	return (
		<div className="border-b border-amber-200 bg-amber-50 text-sm text-amber-900">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
				<p className="flex-1">
					<strong>This is your private demo.</strong> Change anything:
					nobody else sees it, and it's deleted{' '}
					{timeLeft(user.expiresAt)}.
					{error && (
						<span role="alert" className="ml-1 text-red-800">
							{getErrorMessage(error)}
						</span>
					)}
				</p>
				<button
					type="button"
					className="btn btn-outline bg-white py-1"
					onClick={handleSwitch}
					disabled={isLoading}
				>
					{isLoading ? 'Switching…' : `Switch to the ${other}`}
				</button>
			</div>
		</div>
	);
}
