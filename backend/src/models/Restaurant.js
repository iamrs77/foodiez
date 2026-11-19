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
		image: { type: String, trim: true, maxlength: 500, default: '' },
		// the lower-case words of the name, cuisine and area, kept up to date on
		// every save, so search can use an index (see listRestaurants)
		searchTerms: { type: [String], default: [] },
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
	},
	{ timestamps: true },
);

// "Spice Route", "North Indian", "HSR Layout, Bengaluru" ->
// spice, route, north, indian, hsr, layout, bengaluru
export const searchWords = (text) => [
	...new Set(
		text
			.toLowerCase()
			.split(/[^\p{L}\p{N}]+/u)
			.filter(Boolean),
	),
];

restaurantSchema.pre('validate', function () {
	if (
		this.isNew ||
		this.isModified('name') ||
		this.isModified('cuisine') ||
		this.isModified('location')
	) {
		this.searchTerms = searchWords(
			`${this.name} ${this.cuisine} ${this.location}`,
		);
	}
});

// fills in search words for restaurants saved before they existed
restaurantSchema.statics.addMissingSearchTerms = async function () {
	const missing = await this.find({ 'searchTerms.0': { $exists: false } });
	for (const restaurant of missing) {
		restaurant.searchTerms = searchWords(
			`${restaurant.name} ${restaurant.cuisine} ${restaurant.location}`,
		);
		await restaurant.save();
	}
	return missing.length;
};

restaurantSchema.plugin(sandboxPlugin);
// the restaurant list: one sandbox's restaurants, newest first
restaurantSchema.index({ sandbox: 1, createdAt: -1, _id: -1 });
// search: a word that starts with what was typed, within one sandbox
restaurantSchema.index({ sandbox: 1, searchTerms: 1 });
restaurantSchema.plugin(toJSONPlugin, { hide: ['searchTerms'] });

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
