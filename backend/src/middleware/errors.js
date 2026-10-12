import mongoose from 'mongoose';
import { z } from 'zod';

export class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

export function notFound(req, _res, next) {
	next(new HttpError(404, `Route ${req.method} ${req.path} not found`));
}

// every error ends up here (Express 5 also forwards errors from async handlers)
// and is turned into a JSON response: { message, errors? }
export function errorHandler(err, _req, res, _next) {
	if (err instanceof z.ZodError) {
		return res.status(400).json({
			message: 'Some fields are missing or invalid',
			errors: err.issues.map((issue) => ({
				field: issue.path.join('.'),
				message: issue.message,
			})),
		});
	}

	if (err instanceof HttpError) {
		return res.status(err.status).json({ message: err.message });
	}

	if (err instanceof mongoose.Error.CastError) {
		return res.status(400).json({ message: 'Invalid id' });
	}

	if (err instanceof mongoose.Error.ValidationError) {
		return res.status(400).json({
			message: 'Some fields are missing or invalid',
			errors: Object.values(err.errors).map((e) => ({
				field: e.path,
				message: e.message,
			})),
		});
	}

	// duplicate value in a unique index
	if (err?.code === 11000) {
		return res.status(409).json({ message: 'This already exists' });
	}

	// errors from express.json(), like a body that is not valid JSON
	if (err?.type === 'entity.parse.failed') {
		return res
			.status(400)
			.json({ message: 'Request body is not valid JSON' });
	}
	if (err?.status >= 400 && err?.status < 500) {
		return res.status(err.status).json({ message: err.message });
	}

	console.error(err);
	res.status(500).json({ message: 'Something went wrong, please try again' });
}
