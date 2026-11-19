import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import YAML from 'yaml';

// the API's OpenAPI description, written by hand next to the code it
// describes; a contract test checks real responses against it
export const openApiSpec = YAML.parse(
	readFileSync(new URL('./openapi.yaml', import.meta.url), 'utf8'),
);

const swaggerUiDir = path.dirname(
	fileURLToPath(import.meta.resolve('swagger-ui-dist/package.json')),
);

// Swagger UI's start-up script, pointed at our spec. It's served as a file, not
// written inline in the page, so the content security policy allows it
const INITIALIZER = `window.onload = () => {
	window.ui = SwaggerUIBundle({
		url: '/api/openapi.json',
		dom_id: '#swagger-ui',
		deepLinking: true,
		presets: [SwaggerUIBundle.presets.apis],
		layout: 'BaseLayout',
	});
};
`;

// GET /api/openapi.json: the spec; GET /api/docs/: Swagger UI to read and try it
export function apiDocs() {
	const router = express.Router();
	router.get('/openapi.json', (_req, res) => res.json(openApiSpec));
	router.get('/docs/swagger-initializer.js', (_req, res) =>
		res.type('js').send(INITIALIZER),
	);
	router.use('/docs', express.static(swaggerUiDir));
	return router;
}
