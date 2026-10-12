import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import dishRoutes from './routes/dishes.js';
import orderRoutes from './routes/orders.js';
import restaurantRoutes from './routes/restaurants.js';

export function createApp() {
	const app = express();

	// needed for correct client IPs (rate limiting) behind a reverse proxy
	app.set('trust proxy', config.TRUST_PROXY);

	app.use(helmet());
	app.use(cors({ origin: config.CORS_ORIGIN.split(',') }));
	app.use(express.json({ limit: '100kb' }));

	app.get('/api/health', (_req, res) => {
		const dbUp = mongoose.connection.readyState === 1;
		res.status(dbUp ? 200 : 503).json({
			status: dbUp ? 'ok' : 'database unavailable',
		});
	});

	app.use('/api/auth', authRoutes);
	app.use('/api/restaurants', restaurantRoutes);
	app.use('/api/dishes', dishRoutes);
	app.use('/api/cart', requireAuth, requireRole('customer'), cartRoutes);
	app.use('/api/orders', requireAuth, requireRole('customer'), orderRoutes);

	app.use(notFound);
	app.use(errorHandler);

	return app;
}
