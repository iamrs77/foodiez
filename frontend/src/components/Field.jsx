// a labelled form field with the API's error message underneath
export default function Field({ label, htmlFor, error, hint, children }) {
	return (
		<div>
			<label htmlFor={htmlFor} className="label">
				{label}
			</label>
			{children}
			{hint && !error && (
				<p className="mt-1 text-xs text-gray-500">{hint}</p>
			)}
			{error && <p className="mt-1 text-sm text-red-700">{error}</p>}
		</div>
	);
}
