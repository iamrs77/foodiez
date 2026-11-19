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

const timeFormat = new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' });
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

// "7:42 pm"
export const formatTime = (value) => timeFormat.format(new Date(value));

// "just now", "4 minutes ago", "2 hours ago", "3 days ago"
export function formatTimeAgo(value) {
	const minutes = Math.round((Date.now() - new Date(value)) / 60_000);
	if (minutes < 1) {
		return 'just now';
	}
	if (minutes < 60) {
		return relativeFormat.format(-minutes, 'minute');
	}
	const hours = Math.round(minutes / 60);
	if (hours < 24) {
		return relativeFormat.format(-hours, 'hour');
	}
	return relativeFormat.format(-Math.round(hours / 24), 'day');
}
