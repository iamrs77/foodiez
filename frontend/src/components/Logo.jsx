// the same mark as public/favicon.svg: a serving dish on a yellow tile
export function LogoMark({ className = 'h-9 w-9' }) {
	return (
		<svg
			viewBox="0 0 64 64"
			className={className}
			aria-hidden="true"
			focusable="false"
		>
			<rect width="64" height="64" rx="16" fill="#FEE996" />
			<path d="M17 41 A15 15 0 0 1 47 41 Z" fill="#444" />
			<circle cx="32" cy="23" r="3.5" fill="#444" />
			<path
				d="M12 45 H52"
				stroke="#444"
				strokeWidth="4"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function Logo() {
	return (
		<span className="flex items-center gap-2 text-xl font-bold tracking-tight">
			<LogoMark />
			Foodiez
		</span>
	);
}
