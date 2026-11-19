// the steps of an order, in order; a cancelled order stops wherever it was
export const ORDER_STEPS = [
	{ status: 'placed', label: 'Order placed' },
	{ status: 'accepted', label: 'Accepted by the restaurant' },
	{ status: 'preparing', label: 'Being prepared' },
	{ status: 'out_for_delivery', label: 'Out for delivery' },
	{ status: 'delivered', label: 'Delivered' },
];

export const STATUS_LABELS = {
	placed: 'Placed',
	accepted: 'Accepted',
	preparing: 'Being prepared',
	out_for_delivery: 'Out for delivery',
	delivered: 'Delivered',
	cancelled: 'Cancelled',
};

export const STATUS_STYLES = {
	placed: 'bg-amber-100 text-amber-900',
	accepted: 'bg-sky-100 text-sky-900',
	preparing: 'bg-orange-100 text-orange-900',
	out_for_delivery: 'bg-violet-100 text-violet-900',
	delivered: 'bg-green-100 text-green-800',
	cancelled: 'bg-gray-200 text-gray-700',
};

// still on its way: worth refreshing every few seconds
export const isActive = (status) =>
	!['delivered', 'cancelled'].includes(status);

// what a restaurant can do next with an order: [new status, button label]
export const VENDOR_ACTIONS = {
	placed: [
		['accepted', 'Accept'],
		['cancelled', 'Reject'],
	],
	accepted: [
		['preparing', 'Start preparing'],
		['cancelled', 'Cancel'],
	],
	preparing: [['out_for_delivery', 'Send out for delivery']],
	out_for_delivery: [['delivered', 'Mark delivered']],
	delivered: [],
	cancelled: [],
};

// how often open orders are checked for changes
export const ORDER_POLL_MS = 5000;
