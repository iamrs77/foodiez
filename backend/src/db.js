import mongoose from 'mongoose';

// inside inTransaction(fn), every query joins the transaction by itself, so
// none can be left out by forgetting to pass the session
mongoose.set('transactionAsyncLocalStorage', true);

export async function connectDb(uri) {
	mongoose.set('strictQuery', true);
	await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
}

export function disconnectDb() {
	return mongoose.disconnect();
}

let transactionsSupported;

// transactions need a replica set (MongoDB Atlas is one, and so are the
// in-memory database and the Docker setup); a plain local mongod isn't
async function supportsTransactions() {
	if (transactionsSupported === undefined) {
		const hello = await mongoose.connection.db
			.admin()
			.command({ hello: 1 });
		transactionsSupported = Boolean(
			hello.setName || hello.msg === 'isdbgrid',
		);
		if (!transactionsSupported) {
			console.warn(
				'MongoDB is a single server, not a replica set: orders are placed without a transaction',
			);
		}
	}
	return transactionsSupported;
}

// runs fn as one transaction: all of its writes happen, or none do. MongoDB
// retries it by itself if another transaction wrote the same documents first.
export async function inTransaction(fn) {
	if (!(await supportsTransactions())) {
		return fn();
	}
	return mongoose.connection.transaction(() => fn());
}
