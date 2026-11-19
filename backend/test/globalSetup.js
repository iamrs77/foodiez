import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export async function setup(project) {
	mongod = await MongoMemoryServer.create({
		// tests backdate demos to check expiry; MongoDB's once-a-minute clean-up
		// of expired documents mustn't delete them halfway through a test
		instance: { args: ['--setParameter', 'ttlMonitorEnabled=false'] },
	});
	project.provide('mongoUri', mongod.getUri());
}

export async function teardown() {
	await mongod?.stop();
}
