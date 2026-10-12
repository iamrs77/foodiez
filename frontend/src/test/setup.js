import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// test files run in parallel, so give multi-step flows more than the default 1s
configure({ asyncUtilTimeout: 3000 });

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	localStorage.clear();
});
