import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet;

export async function setup(project) {
	// a one-member replica set, like MongoDB Atlas, so orders run in transactions
	replSet = await MongoMemoryReplSet.create({
		replSet: {
			count: 1,
			storageEngine: 'wiredTiger',
			// tests backdate demos to check expiry; MongoDB's once-a-minute clean-up
			// of expired documents mustn't delete them halfway through a test
			args: ['--setParameter', 'ttlMonitorEnabled=false'],
		},
	});
	project.provide('mongoUri', replSet.getUri());
}

export async function teardown() {
	await replSet?.stop();
}
