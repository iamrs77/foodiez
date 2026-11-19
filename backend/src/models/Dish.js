import mongoose from 'mongoose';
import { sandboxPlugin } from './Sandbox.js';
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
		// the restaurant's own menu sections, e.g. "Starters" or "Pizzas"
		category: { type: String, trim: true, maxlength: 40, default: 'Menu' },
		// false while it's sold out: shown on the menu, but can't be ordered
		available: { type: Boolean, default: true },
		// a photo: a link, or a path to one of the demo photos
		image: { type: String, trim: true, maxlength: 500, default: '' },
	},
	{ timestamps: true },
);

// a restaurant can't have two dishes with the same name
dishSchema.index({ restaurant: 1, name: 1 }, { unique: true });

dishSchema.plugin(sandboxPlugin);
dishSchema.plugin(toJSONPlugin);

export const Dish = mongoose.model('Dish', dishSchema);
