import mongoose from 'mongoose';
import { sandboxPlugin } from './Sandbox.js';
import { toJSONPlugin } from './toJSON.js';

const restaurantSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 80 },
		cuisine: { type: String, required: true, trim: true, maxlength: 60 },
		location: { type: String, required: true, trim: true, maxlength: 120 },
		priceForTwo: { type: Number, required: true, min: 0 },
		deliveryTimeMinutes: { type: Number, required: true, min: 5, max: 180 },
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
	},
	{ timestamps: true },
);

restaurantSchema.plugin(sandboxPlugin);
// the restaurant list: one sandbox's restaurants, newest first
restaurantSchema.index({ sandbox: 1, createdAt: -1, _id: -1 });
restaurantSchema.plugin(toJSONPlugin);

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
