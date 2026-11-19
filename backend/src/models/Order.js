import mongoose from 'mongoose';
import { sandboxPlugin } from './Sandbox.js';
import { toJSONPlugin } from './toJSON.js';

// an order's journey; delivered and cancelled are the end
export const ORDER_STATUSES = [
	'placed',
	'accepted',
	'preparing',
	'out_for_delivery',
	'delivered',
	'cancelled',
];

// what the restaurant can move an order to from each status
export const NEXT_STATUSES = {
	placed: ['accepted', 'cancelled'],
	accepted: ['preparing', 'cancelled'],
	preparing: ['out_for_delivery'],
	out_for_delivery: ['delivered'],
	delivered: [],
	cancelled: [],
};

export const ACTIVE_STATUSES = [
	'placed',
	'accepted',
	'preparing',
	'out_for_delivery',
];

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

const deliverySchema = new mongoose.Schema(
	{
		address: { type: String, required: true, maxlength: 300 },
		phone: { type: String, required: true, maxlength: 20 },
		note: { type: String, maxlength: 200, default: '' },
	},
	{ _id: false },
);

const statusChangeSchema = new mongoose.Schema(
	{
		status: { type: String, enum: ORDER_STATUSES, required: true },
		at: { type: Date, required: true },
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
		// copied, so the restaurant sees who ordered without reading the account
		customerName: { type: String, required: true },
		restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
		restaurantName: { type: String, required: true },
		items: { type: [orderItemSchema], required: true },
		total: { type: Number, required: true, min: 0 },
		delivery: { type: deliverySchema, required: true },
		status: { type: String, enum: ORDER_STATUSES, default: 'placed' },
		// when the order reached each status, for the customer's tracking page
		statusHistory: { type: [statusChangeSchema], default: [] },
		// from the Idempotency-Key header: a retried request gets the same order back
		idempotencyKey: { type: String },
	},
	{ timestamps: true },
);

// a restaurant's orders, oldest first for the kitchen
orderSchema.index({ restaurant: 1, status: 1, createdAt: 1 });
// one order per key per customer
orderSchema.index(
	{ user: 1, idempotencyKey: 1 },
	{
		unique: true,
		partialFilterExpression: { idempotencyKey: { $type: 'string' } },
	},
);

orderSchema.plugin(sandboxPlugin);
orderSchema.plugin(toJSONPlugin, { hide: ['idempotencyKey'] });

export const Order = mongoose.model('Order', orderSchema);
