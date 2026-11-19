import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { Sandbox } from '../models/Sandbox.js';
import { User } from '../models/User.js';
import { demoUsers } from '../seed/demoData.js';
import { loadDemoData, sandboxEmail } from '../seed/seed.js';

const HOUR = 60 * 60 * 1000;

export const startDemoSchema = z.object({
	as: z.enum(['customer', 'vendor']).default('customer'),
});

// demo accounts are reached through their demo, never by password, so they get
// a hash of a password nobody knows
const NO_PASSWORD_HASH = await User.hashPassword(
	randomBytes(32).toString('hex'),
);

// the demo account a visitor plays: the customer, or the vendor with three restaurants
const demoEmailFor = (role) =>
	demoUsers.find((user) => user.role === role).email;

// GET /api/config: what the web app should offer, e.g. a "Try the demo" button
export function getPublicConfig(_req, res) {
	res.json({
		signupsEnabled: config.SIGNUPS_ENABLED,
		demoEnabled: config.DEMO_ENABLED,
		demoAccountsLogin: config.DEMO_ACCOUNTS_LOGIN,
		demoHours: config.DEMO_TTL_HOURS,
	});
}

// POST /api/demo { as: 'customer' | 'vendor' }
// gives the visitor a private copy of the demo data and logs them in to it
export async function startDemo(req, res) {
	if (!config.DEMO_ENABLED) {
		throw new HttpError(404, 'The demo is turned off here');
	}

	// a soft cap: two visitors at the same moment can both get in, which is fine
	const active = await Sandbox.countDocuments({
		expiresAt: { $gt: new Date() },
	});
	if (active >= config.DEMO_MAX_ACTIVE) {
		throw new HttpError(
			503,
			'The demo is very popular right now. Please try again in a few minutes.',
		);
	}

	const sandbox = await Sandbox.create({
		expiresAt: new Date(Date.now() + config.DEMO_TTL_HOURS * HOUR),
	});
	const users = await loadDemoData({
		sandbox,
		passwordHash: NO_PASSWORD_HASH,
	});
	const email = sandboxEmail(demoEmailFor(req.body.as), sandbox.id);
	const user = users.find((u) => u.email === email);

	res.status(201).json({ token: signToken(user), user });
}

// POST /api/demo/switch: the other side of the same demo, so a visitor can
// change a menu as the vendor and then order from it as the customer
export async function switchDemoRole(req, res) {
	if (!req.user.sandbox) {
		throw new HttpError(400, 'Only demo accounts can switch');
	}
	const role = req.user.role === 'customer' ? 'vendor' : 'customer';
	const user = await User.findOne({
		email: sandboxEmail(demoEmailFor(role), req.user.sandbox.toString()),
		sandbox: req.user.sandbox,
	});
	if (!user) {
		throw new HttpError(404, 'This demo has ended');
	}
	res.json({ token: signToken(user), user });
}
