import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config.js';
import { apiDocs } from './docs.js';
import { requestLogger } from './logger.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import demoRoutes from './routes/demo.js';
import dishRoutes from './routes/dishes.js';
import orderRoutes from './routes/orders.js';
import restaurantRoutes from './routes/restaurants.js';
import vendorOrderRoutes from './routes/vendorOrders.js';

export function createApp() {
	const app = express();

	// needed for correct client IPs (rate limiting) behind a reverse proxy
	app.set('trust proxy', config.TRUST_PROXY);
	app.disable('x-powered-by');

	app.use(requestLogger);
	app.use(
		helmet({
			// restaurants and dishes can show photos from any https address
			contentSecurityPolicy: {
				directives: { 'img-src': ["'self'", 'data:', 'https:'] },
			},
		}),
	);
	app.use(cors({ origin: config.CORS_ORIGIN.split(',') }));
	app.use(express.json({ limit: '100kb' }));

	app.get('/api/health', (_req, res) => {
		const dbUp = mongoose.connection.readyState === 1;
		res.status(dbUp ? 200 : 503).json({
			status: dbUp ? 'ok' : 'database unavailable',
		});
	});

	app.use('/api', apiDocs());
	app.use('/api', demoRoutes);
	app.use('/api/auth', authRoutes);
	app.use('/api/restaurants', restaurantRoutes);
	app.use('/api/dishes', dishRoutes);
	app.use('/api/cart', requireAuth, requireRole('customer'), cartRoutes);
	app.use('/api/orders', requireAuth, requireRole('customer'), orderRoutes);
	app.use(
		'/api/vendor/orders',
		requireAuth,
		requireRole('vendor'),
		vendorOrderRoutes,
	);
	app.use('/api', notFound);

	if (config.WEB_APP_DIR) {
		serveWebApp(app, path.resolve(config.WEB_APP_DIR));
	}

	app.use(notFound);
	app.use(errorHandler);

	return app;
}

// the built web app: its files, and index.html for every other page, so the
// web app's router can show it
function serveWebApp(app, dir) {
	const indexHtml = path.join(dir, 'index.html');
	if (!existsSync(indexHtml)) {
		throw new Error(
			`WEB_APP_DIR is set, but ${indexHtml} doesn't exist. Build the web app first.`,
		);
	}
	// built file names contain a hash of their content, so they can be cached for good
	app.use(
		'/assets',
		express.static(path.join(dir, 'assets'), {
			immutable: true,
			maxAge: '1y',
		}),
	);
	app.use(express.static(dir, { index: false }));
	app.get('/{*page}', (_req, res) => {
		res.set('Cache-Control', 'no-cache').sendFile(indexHtml);
	});
}
