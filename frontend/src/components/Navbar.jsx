import { LogOut, ReceiptText, ShoppingBasket, Store } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router';
import { logout, useGetCartQuery } from '../app/api';
import { selectUser } from '../features/auth/authSlice';
import { Logo } from './Logo';

const linkClass = ({ isActive }) =>
	`btn hover:bg-brand ${isActive ? 'bg-brand' : ''}`;

function CartLink() {
	const { data: cart } = useGetCartQuery();
	const count =
		cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

	return (
		<NavLink
			to="/cart"
			className={linkClass}
			aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
		>
			<span className="relative mr-1">
				<ShoppingBasket size={20} />
				{count > 0 && (
					<span className="absolute -top-2 -right-2 min-w-5 rounded-full bg-ink px-1 text-center text-xs leading-5 text-white">
						{count > 99 ? '99+' : count}
					</span>
				)}
			</span>
			<span className="hidden sm:inline">Cart</span>
		</NavLink>
	);
}

export default function Navbar() {
	const user = useSelector(selectUser);
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const handleLogout = () => {
		dispatch(logout());
		navigate('/');
	};

	return (
		<header className="sticky top-0 z-30 bg-white shadow-md">
			<nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
				<Link to="/" aria-label="Foodiez home">
					<Logo />
				</Link>

				{!user && (
					<div className="flex items-center gap-1">
						<NavLink to="/login" className={linkClass}>
							Log in
						</NavLink>
						<Link to="/register" className="btn btn-primary">
							Sign up
						</Link>
					</div>
				)}

				{user && (
					<div className="flex items-center gap-1">
						{user.role === 'customer' && (
							<>
								<NavLink to="/orders" className={linkClass}>
									<ReceiptText size={20} />
									<span className="hidden sm:inline">
										Orders
									</span>
								</NavLink>
								<CartLink />
							</>
						)}
						{user.role === 'vendor' && (
							<NavLink to="/vendor" className={linkClass}>
								<Store size={20} />
								<span className="hidden sm:inline">
									My restaurants
								</span>
							</NavLink>
						)}
						<span className="hidden px-2 text-sm text-gray-500 md:inline">
							Hi, {user.firstName}
						</span>
						<button
							type="button"
							onClick={handleLogout}
							className="btn hover:bg-brand"
						>
							<LogOut size={20} />
							<span className="hidden sm:inline">Log out</span>
						</button>
					</div>
				)}
			</nav>
		</header>
	);
}
