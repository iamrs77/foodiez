import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../src/middleware/errors.js';
import { requestLogger } from '../src/logger.js';
import { api } from './helpers.js';

describe('request ids', () => {
	it('sends one back with every response, keeping a valid one the client sent', async () => {
		const made = await api.get('/api/health');
		expect(made.headers['x-request-id']).toMatch(/^[\w-]{36}$/);

		const kept = await api
			.get('/api/health')
			.set('X-Request-Id', 'trace-123');
		expect(kept.headers['x-request-id']).toBe('trace-123');

		const replaced = await api
			.get('/api/health')
			.set('X-Request-Id', 'not allowed!');
		expect(replaced.headers['x-request-id']).not.toBe('not allowed!');
	});

	it('includes the id in an unexpected error, so it can be found in the logs', async () => {
		const app = express();
		app.use(requestLogger);
		app.get('/boom', () => {
			throw new Error('database exploded');
		});
		app.use(errorHandler);

		const res = await request(app).get('/boom').expect(500);
		expect(res.body).toEqual({
			message: 'Something went wrong, please try again',
			requestId: res.headers['x-request-id'],
		});
		// the details stay in the logs, not in the response
		expect(JSON.stringify(res.body)).not.toContain('exploded');
	});
});
