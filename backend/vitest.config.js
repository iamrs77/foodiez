import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// one in-memory MongoDB for the whole run, each test file gets its own database
		globalSetup: ['./test/globalSetup.js'],
		setupFiles: ['./test/setup.js'],
		testTimeout: 20_000,
		// the first run downloads a MongoDB binary
		hookTimeout: 180_000,
	},
});
