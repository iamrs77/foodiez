// npm run dev:memory
// Runs the API with a temporary in-memory MongoDB and demo data, so you can try
// the app without installing MongoDB or Docker. Data is lost when you stop it.
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();

process.env.MONGODB_URI = mongod.getUri('foodiez');
process.env.SEED_DEMO_DATA = 'true';
process.env.JWT_SECRET ??= 'dev-only-secret-do-not-use-in-production';

console.log(
	'Using a temporary in-memory MongoDB (data is lost when you stop the API)',
);
await import('../src/server.js');
