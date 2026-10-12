import js from '@eslint/js';
import globals from 'globals';

export default [
	{ ignores: ['node_modules', 'coverage'] },
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: globals.node,
		},
		rules: {
			// Express needs (err, req, res, next) even when some are unused
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		},
	},
];
