import mongoose from 'mongoose';
import { HttpError } from './errors.js';

// replaces req.body with the parsed value, so unknown fields are dropped
// and handlers only see clean data
export function validateBody(schema) {
	return (req, _res, next) => {
		req.body = schema.parse(req.body ?? {});
		next();
	};
}

// used with router.param('id', ...) so every :id is checked once
export function checkObjectId(_req, _res, next, value) {
	if (!mongoose.isValidObjectId(value)) {
		return next(new HttpError(400, 'Invalid id'));
	}
	next();
}
