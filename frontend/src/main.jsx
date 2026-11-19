import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { makeStore } from './app/store';
import './index.css';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<Provider store={makeStore()}>
			<BrowserRouter>
				{/* the last resort, if even the navbar can't render */}
				<ErrorBoundary>
					<App />
				</ErrorBoundary>
			</BrowserRouter>
		</Provider>
	</StrictMode>,
);
