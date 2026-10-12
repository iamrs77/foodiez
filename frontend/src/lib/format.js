const priceFormat = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 2,
	minimumFractionDigits: 0,
});

const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
	dateStyle: 'medium',
	timeStyle: 'short',
});

// 1234 -> "₹1,234"
export const formatPrice = (amount) => priceFormat.format(amount);

// in the viewer's own time zone
export const formatDateTime = (value) => dateTimeFormat.format(new Date(value));
