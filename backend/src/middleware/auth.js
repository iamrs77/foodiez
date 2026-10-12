import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { HttpError } from './errors.js';

export function signToken(user) {
	return jwt.sign({ sub: user.id, role: user.role }, config.JWT_SECRET, {
		expiresIn: config.JWT_EXPIRES_IN,
	});
}

// reads "Authorization: Bearer <token>" and loads the user into req.user
export async function requireAuth(req, _res, next) {
	const [scheme, token] = (req.get('authorization') ?? '').split(' ');
	if (scheme !== 'Bearer' || !token) {
		throw new HttpError(401, 'Please log in first');
	}

	let payload;
	try {
		payload = jwt.verify(token, config.JWT_SECRET);
	} catch {
		throw new HttpError(
			401,
			'Your session has expired, please log in again',
		);
	}

	// the account may have been deleted since the token was issued
	const user = await User.findById(payload.sub);
	if (!user) {
		throw new HttpError(401, 'Please log in first');
	}

	req.user = user;
	next();
}

export function requireRole(role) {
	return (req, _res, next) => {
		if (req.user.role !== role) {
			throw new HttpError(403, `Only ${role}s can do this`);
		}
		next();
	};
}
