// API responses use `id` instead of Mongo's `_id` and `__v`,
// and never include fields listed in `hide` (like the password hash)
export function toJSONPlugin(schema, { hide = [] } = {}) {
	schema.set('toJSON', {
		virtuals: true,
		versionKey: false,
		transform(_doc, ret) {
			delete ret._id;
			for (const field of hide) {
				delete ret[field];
			}
			return ret;
		},
	});
}
