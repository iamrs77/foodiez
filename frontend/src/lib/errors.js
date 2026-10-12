const UNREACHABLE = "Can't reach the server. Is the API running?";

// turns an RTK Query error into something to show the user
export function getErrorMessage(error) {
	if (!error) {
		return null;
	}
	if (error.data?.message) {
		return error.data.message;
	}

	// no answer at all, or a 5xx without our JSON body: that comes from the
	// dev server or nginx when the API is down, not from the API itself
	const status = error.originalStatus ?? error.status;
	if (error.status === 'FETCH_ERROR' || status >= 500) {
		return UNREACHABLE;
	}
	return 'Something went wrong, please try again';
}

// { field: message } from the API's 400 responses, for showing under inputs
export function getFieldErrors(error) {
	const fieldErrors = {};
	for (const { field, message } of error?.data?.errors ?? []) {
		fieldErrors[field] ??= message;
	}
	return fieldErrors;
}
