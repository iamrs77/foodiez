import mongoose from 'mongoose';

// A sandbox is one visitor's private copy of the demo data ("Try the demo").
// Every document in it (users, restaurants, dishes, carts, orders) points to the
// sandbox and carries the same expiresAt. Everything else, the showcase data
// and real accounts, has sandbox: null.
const sandboxSchema = new mongoose.Schema(
	{ expiresAt: { type: Date, required: true } },
	{ timestamps: true },
);

// MongoDB deletes each document by itself once expiresAt has passed (a TTL
// index), so an expired demo cleans itself up with no job to run. The check runs
// about once a minute, so login checks expiresAt too.
const expireAt = (schema) =>
	schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

expireAt(sandboxSchema);

export const Sandbox = mongoose.model('Sandbox', sandboxSchema);

// adds the sandbox fields to a model's schema
export function sandboxPlugin(schema) {
	schema.add({
		sandbox: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Sandbox',
			default: null,
		},
		// only set on sandbox documents; documents without it never expire
		expiresAt: { type: Date },
	});
	expireAt(schema);
}

// the sandbox a logged-in user works in, or null for the showcase and real accounts
export const sandboxOf = (user) => user?.sandbox ?? null;

// the fields that put a new document in the same sandbox as `doc` (a user or a restaurant)
export const sameSandboxAs = (doc) => ({
	sandbox: doc.sandbox ?? null,
	expiresAt: doc.expiresAt,
});
