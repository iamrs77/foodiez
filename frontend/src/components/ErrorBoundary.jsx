import { Component } from 'react';

// Catches a crash while rendering a page, so the visitor sees a message
// instead of a blank screen. A new resetKey (the page address) clears it, so
// moving to another page works again.
export default class ErrorBoundary extends Component {
	state = { error: null, resetKey: this.props.resetKey };

	static getDerivedStateFromError(error) {
		return { error };
	}

	static getDerivedStateFromProps(props, state) {
		if (props.resetKey !== state.resetKey) {
			return { error: null, resetKey: props.resetKey };
		}
		return null;
	}

	componentDidCatch(error, info) {
		console.error('A page crashed:', error, info.componentStack);
	}

	render() {
		if (!this.state.error) {
			return this.props.children;
		}
		return (
			<div
				role="alert"
				className="card mx-auto mt-8 max-w-md p-10 text-center"
			>
				<div className="text-5xl" aria-hidden="true">
					🍳
				</div>
				<h1 className="mt-4 text-xl font-bold">
					Something went wrong on this page
				</h1>
				<p className="mt-2 text-gray-500">
					Try loading it again. If it keeps happening, go back to the
					home page.
				</p>
				<div className="mt-6 flex justify-center gap-2">
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => window.location.reload()}
					>
						Reload
					</button>
					<a href="/" className="btn btn-outline">
						Home page
					</a>
				</div>
			</div>
		);
	}
}
