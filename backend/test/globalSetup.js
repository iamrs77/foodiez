import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export async function setup(project) {
	mongod = await MongoMemoryServer.create();
	project.provide('mongoUri', mongod.getUri());
}

export async function teardown() {
	await mongod?.stop();
}
