// npm run dev:memory
// Runs the API with a temporary in-memory MongoDB and demo data, so you can try
// the app without installing MongoDB or Docker. Data is lost when you stop it.
import { MongoMemoryReplSet } from 'mongodb-memory-server';

// a one-member replica set, like MongoDB Atlas, so orders run in transactions
const replSet = await MongoMemoryReplSet.create({
	replSet: { count: 1, storageEngine: 'wiredTiger' },
});

process.env.MONGODB_URI = replSet.getUri('foodiez');
process.env.SEED_DEMO_DATA = 'true';
process.env.JWT_SECRET ??= 'dev-only-secret-do-not-use-in-production';

console.log(
	'Using a temporary in-memory MongoDB (data is lost when you stop the API)',
);
await import('../src/server.js');
