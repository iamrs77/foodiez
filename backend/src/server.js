import { createApp } from './app.js';
import { config } from './config.js';
import { connectDb, disconnectDb } from './db.js';
import { seedIfEmpty } from './seed/seed.js';

try {
	await connectDb(config.MONGODB_URI);
} catch (err) {
	console.error(`Could not connect to MongoDB: ${err.message}`);
	console.error(
		'Check MONGODB_URI in .env, or start the database with "docker compose up -d db".',
	);
	process.exit(1);
}

if (config.SEED_DEMO_DATA && (await seedIfEmpty())) {
	console.log('Empty database: added demo restaurants and accounts');
}

// Express 5 passes startup errors (like a busy port) to this callback
const server = createApp().listen(config.PORT, (err) => {
	if (err) {
		console.error(
			err.code === 'EADDRINUSE'
				? `Port ${config.PORT} is already in use. Stop the program that uses it, or set another PORT in .env.`
				: `Could not start the API: ${err.message}`,
		);
		process.exit(1);
	}
	console.log(`Foodiez API listening on http://localhost:${config.PORT}`);
});

// finish open requests and close the database connection on Ctrl+C or docker stop
for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => {
		server.close(() => disconnectDb().then(() => process.exit(0)));
	});
}
