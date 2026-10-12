import mongoose from 'mongoose';
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

restaurantSchema.plugin(toJSONPlugin);

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
