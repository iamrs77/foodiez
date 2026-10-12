import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
	loadSession,
	saveSession,
} from '../features/auth/authSlice';
import { api } from './api';

// a function rather than one shared store, so each test gets a fresh one
export function makeStore(preloadedState = { auth: loadSession() }) {
	const store = configureStore({
		reducer: {
			auth: authReducer,
			[api.reducerPath]: api.reducer,
		},
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware().concat(api.middleware),
		preloadedState,
	});

	// remember the login across page reloads
	let lastAuth = store.getState().auth;
	store.subscribe(() => {
		const { auth } = store.getState();
		if (auth !== lastAuth) {
			lastAuth = auth;
			saveSession(auth);
		}
	});

	return store;
}
