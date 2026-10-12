import { useEffect, useState } from 'react';

// waits until the value stops changing, so search doesn't call the API on every key
export function useDebouncedValue(value, delay = 300) {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}
