import { Outlet, useLocation } from 'react-router';
import DemoBanner from './DemoBanner';
import ErrorBoundary from './ErrorBoundary';
import Navbar from './Navbar';

export default function Layout() {
	const { pathname } = useLocation();
	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<DemoBanner />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
				{/* a crash in one page keeps the navbar, and clears on the next page */}
				<ErrorBoundary resetKey={pathname}>
					<Outlet />
				</ErrorBoundary>
			</main>
			<footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
				Foodiez, a demo food ordering app by Rohit Sharma ·{' '}
				<a
					href="https://github.com/iamrs77/foodiez"
					className="underline hover:text-ink"
				>
					Source on GitHub
				</a>
			</footer>
		</div>
	);
}
