import { STATUS_LABELS, STATUS_STYLES } from '../lib/orderStatus';

export default function OrderStatusBadge({ status }) {
	return (
		<span
			className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
		>
			{STATUS_LABELS[status]}
		</span>
	);
}
