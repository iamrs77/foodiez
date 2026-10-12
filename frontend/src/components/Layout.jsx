import { Outlet } from 'react-router';
import Navbar from './Navbar';

export default function Layout() {
	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
				<Outlet />
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
