import { Link } from 'react-router';
import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
	return (
		<EmptyState emoji="🍽️" title="Page not found">
			<p>This page isn't on the menu.</p>
			<Link to="/" className="btn btn-primary mt-6">
				Back to restaurants
			</Link>
		</EmptyState>
	);
}
