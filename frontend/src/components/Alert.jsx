import { CircleAlert, CircleCheck, Info } from 'lucide-react';

const STYLES = {
	error: ['border-red-200 bg-red-50 text-red-800', CircleAlert],
	success: ['border-green-200 bg-green-50 text-green-800', CircleCheck],
	info: ['border-amber-200 bg-amber-50 text-amber-900', Info],
};

export default function Alert({ type = 'info', children, action }) {
	const [classes, Icon] = STYLES[type];
	return (
		<div
			role={type === 'error' ? 'alert' : 'status'}
			className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${classes}`}
		>
			<Icon size={18} className="shrink-0" />
			<span className="flex-1">{children}</span>
			{action}
		</div>
	);
}
