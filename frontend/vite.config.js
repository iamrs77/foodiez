import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		port: 5173,
		// during development the API runs separately, so pass /api calls on to it
		proxy: {
			'/api': process.env.API_PROXY_TARGET ?? 'http://localhost:5000',
		},
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.js'],
		// fetch in tests needs a full URL
		env: { VITE_API_URL: 'http://localhost/api' },
	},
});
