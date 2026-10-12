import mongoose from 'mongoose';
import { toJSONPlugin } from './toJSON.js';

// a copy of the dish at the time of ordering, so later price or name changes
// don't rewrite order history
const orderItemSchema = new mongoose.Schema(
	{
		dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
		name: { type: String, required: true },
		price: { type: Number, required: true },
		quantity: { type: Number, required: true, min: 1 },
		isVeg: { type: Boolean, default: true },
	},
	{ _id: false },
);

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
		restaurantName: { type: String, required: true },
		items: { type: [orderItemSchema], required: true },
		total: { type: Number, required: true, min: 0 },
	},
	{ timestamps: true },
);

orderSchema.plugin(toJSONPlugin);

export const Order = mongoose.model('Order', orderSchema);
