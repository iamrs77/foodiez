import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, inject } from 'vitest';

// set before any app code reads the config
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough';
process.env.MONGODB_URI = 'mongodb://set-by-the-tests';

beforeAll(async () => {
	await mongoose.connect(inject('mongoUri'), {
		dbName: `test-${randomUUID()}`,
	});
	// build unique indexes now, so tests that rely on them don't race
	await Promise.all(
		Object.values(mongoose.models).map((model) => model.init()),
	);
});

// every test starts with empty collections
beforeEach(async () => {
	await Promise.all(
		Object.values(mongoose.connection.collections).map((collection) =>
			collection.deleteMany({}),
		),
	);
});

afterAll(async () => {
	await mongoose.connection.dropDatabase();
	await mongoose.disconnect();
});
