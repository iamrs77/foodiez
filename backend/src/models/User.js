import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { toJSONPlugin } from './toJSON.js';

export const ROLES = ['customer', 'vendor'];

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		firstName: { type: String, required: true, trim: true, maxlength: 50 },
		lastName: { type: String, required: true, trim: true, maxlength: 50 },
		role: { type: String, enum: ROLES, required: true },
		// never loaded unless asked for with .select('+passwordHash')
		passwordHash: { type: String, required: true, select: false },
	},
	{ timestamps: true },
);

userSchema.plugin(toJSONPlugin, { hide: ['passwordHash'] });

userSchema.statics.hashPassword = function (password) {
	return bcrypt.hash(password, 10);
};

userSchema.methods.checkPassword = function (password) {
	return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
