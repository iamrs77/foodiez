import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router';
import { selectUser } from '../features/auth/authSlice';

// wraps routes that need a login with a certain role
export default function RequireRole({ role }) {
	const user = useSelector(selectUser);
	const location = useLocation();

	if (!user) {
		// come back here after logging in
		return (
			<Navigate to="/login" replace state={{ from: location.pathname }} />
		);
	}
	if (user.role !== role) {
		return <Navigate to="/" replace />;
	}
	return <Outlet />;
}
