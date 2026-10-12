import bcrypt from 'bcrypt';
import { z } from 'zod';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { ROLES, User } from '../models/User.js';

const email = z
	.string()
	.trim()
	.toLowerCase()
	.pipe(z.email('Enter a valid email address'));

export const registerSchema = z.object({
	email,
	firstName: z.string().trim().min(1, 'First name is required').max(50),
	lastName: z.string().trim().min(1, 'Last name is required').max(50),
	// bcrypt only looks at the first 72 bytes
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(72, 'Password must be at most 72 characters'),
	// there is no admin role, so nobody can sign up as one
	role: z.enum(ROLES).default('customer'),
});

export const loginSchema = z.object({
	email,
	password: z.string().min(1, 'Password is required'),
});

// compared against when the email is unknown, so a wrong email takes as long
// as a wrong password and response times don't reveal who has an account
const DUMMY_HASH = await bcrypt.hash('not-a-real-password', 10);

export async function register(req, res) {
	const { password, ...profile } = req.body;

	if (await User.exists({ email: profile.email })) {
		throw new HttpError(409, 'An account with this email already exists');
	}

	const user = await User.create({
		...profile,
		passwordHash: await User.hashPassword(password),
	});

	res.status(201).json({ token: signToken(user), user });
}

export async function login(req, res) {
	const user = await User.findOne({ email: req.body.email }).select(
		'+passwordHash',
	);
	const passwordMatches = await bcrypt.compare(
		req.body.password,
		user?.passwordHash ?? DUMMY_HASH,
	);

	// same message for both cases, so nobody can find out which emails exist
	if (!user || !passwordMatches) {
		throw new HttpError(401, 'Wrong email or password');
	}

	res.json({ token: signToken(user), user });
}

export function me(req, res) {
	res.json(req.user);
}
