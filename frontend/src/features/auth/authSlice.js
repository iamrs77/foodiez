import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'foodiez.session';
const loggedOutState = { token: null, user: null };

// the session survives page reloads; storage can be blocked (private mode),
// so failures just mean the user has to log in again
export function loadSession() {
	try {
		const session = JSON.parse(localStorage.getItem(STORAGE_KEY));
		if (session?.token && session?.user) {
			return session;
		}
	} catch {
		// nothing stored, or storage is blocked
	}
	return loggedOutState;
}

export function saveSession(session) {
	try {
		if (session.token) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	} catch {
		// storage is blocked
	}
}

const authSlice = createSlice({
	name: 'auth',
	initialState: loggedOutState,
	reducers: {
		loggedIn: (_state, action) => ({
			token: action.payload.token,
			user: action.payload.user,
		}),
		loggedOut: () => loggedOutState,
	},
});

export const { loggedIn, loggedOut } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.user?.role ?? null;
