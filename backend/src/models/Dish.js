import mongoose from 'mongoose';
import { toJSONPlugin } from './toJSON.js';

const dishSchema = new mongoose.Schema(
	{
		restaurant: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Restaurant',
			required: true,
		},
		name: { type: String, required: true, trim: true, maxlength: 80 },
		description: { type: String, trim: true, maxlength: 300, default: '' },
		price: { type: Number, required: true, min: 0 },
		isVeg: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

// a restaurant can't have two dishes with the same name
dishSchema.index({ restaurant: 1, name: 1 }, { unique: true });

dishSchema.plugin(toJSONPlugin);

export const Dish = mongoose.model('Dish', dishSchema);
