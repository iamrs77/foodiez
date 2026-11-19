// API responses use `id` instead of Mongo's `_id` and `__v`, and never
// include the sandbox id or fields listed in `hide` (like the password hash)
export function toJSONPlugin(schema, { hide = [] } = {}) {
	schema.set('toJSON', {
		virtuals: true,
		versionKey: false,
		transform(_doc, ret) {
			delete ret._id;
			for (const field of ['sandbox', ...hide]) {
				delete ret[field];
			}
			return ret;
		},
	});
}
