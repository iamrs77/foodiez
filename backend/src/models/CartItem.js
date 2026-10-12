import mongoose from 'mongoose';
import { toJSONPlugin } from './toJSON.js';

export const MAX_QUANTITY = 20;

const cartItemSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		dish: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Dish',
			required: true,
		},
		quantity: { type: Number, required: true, min: 1, max: MAX_QUANTITY },
	},
	{ timestamps: true },
);

// one row per dish in a user's cart, adding it again raises the quantity
cartItemSchema.index({ user: 1, dish: 1 }, { unique: true });

cartItemSchema.plugin(toJSONPlugin);

export const CartItem = mongoose.model('CartItem', cartItemSchema);
