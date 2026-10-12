// turns an RTK Query error into something to show the user
export function getErrorMessage(error) {
	if (!error) {
		return null;
	}
	if (error.status === 'FETCH_ERROR') {
		return "Can't reach the server. Is the API running?";
	}
	return error.data?.message ?? 'Something went wrong, please try again';
}

// { field: message } from the API's 400 responses, for showing under inputs
export function getFieldErrors(error) {
	const fieldErrors = {};
	for (const { field, message } of error?.data?.errors ?? []) {
		fieldErrors[field] ??= message;
	}
	return fieldErrors;
}
