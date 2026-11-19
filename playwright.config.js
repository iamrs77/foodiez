import { defineConfig, devices } from '@playwright/test';

const PORT = 4100;

// Browser tests of the whole app, run the way the public demo runs it: one
// service in production mode, with private demos and the shared demo accounts
// locked, against a temporary in-memory MongoDB.
export default defineConfig({
	testDir: 'e2e',
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// PLAYWRIGHT_CHANNEL=chrome uses your own Chrome instead of
				// downloading one with "npx playwright install chromium"
				channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
			},
		},
	],
	webServer: {
		command: 'npm run build && node backend/scripts/dev-memory.js',
		url: `http://localhost:${PORT}/api/health`,
		reuseExistingServer: !process.env.CI,
		// the first run downloads MongoDB
		timeout: 180_000,
		env: {
			NODE_ENV: 'production',
			PORT: String(PORT),
			WEB_APP_DIR: 'frontend/dist',
			DEMO_ACCOUNTS_LOGIN: 'false',
			SIGNUPS_ENABLED: 'false',
			DEMO_RATE_LIMIT: '1000',
			LOG_LEVEL: 'warn',
		},
	},
});
