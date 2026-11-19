import { randomUUID } from 'node:crypto';
import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import { config } from './config.js';

// readable, coloured lines while developing (if pino-pretty is installed);
// one JSON object per line everywhere else, for log search tools
function prettyTransport() {
	if (config.NODE_ENV !== 'development') {
		return undefined;
	}
	try {
		import.meta.resolve('pino-pretty');
		return {
			target: 'pino-pretty',
			// one line per request; the full fields stay in production's JSON
			options: {
				ignore: 'pid,hostname',
				translateTime: 'HH:MM:ss',
				hideObject: true,
			},
		};
	} catch {
		return undefined;
	}
}

export const logger = pino({
	level: config.LOG_LEVEL,
	transport: prettyTransport(),
	// never write login tokens to the logs
	redact: ['req.headers.authorization', 'req.headers.cookie'],
});

// logs one line per request, with an id that's also sent back as X-Request-Id,
// so a user's error report can be matched to its log line
export const requestLogger = pinoHttp({
	logger,
	genReqId(req, res) {
		const given = req.headers['x-request-id'];
		const id =
			typeof given === 'string' && /^[\w-]{1,100}$/.test(given)
				? given
				: randomUUID();
		res.setHeader('X-Request-Id', id);
		return id;
	},
	// Render checks health every few seconds; those lines would drown the rest
	autoLogging: { ignore: (req) => req.url === '/api/health' },
	customLogLevel(_req, res, err) {
		if (err || res.statusCode >= 500) {
			return 'error';
		}
		return res.statusCode >= 400 ? 'warn' : 'info';
	},
	customSuccessMessage: (req, res, ms) =>
		`${req.method} ${req.originalUrl} ${res.statusCode} ${Math.round(ms)}ms`,
	customErrorMessage: (req, res, err) =>
		`${req.method} ${req.originalUrl} ${res.statusCode} ${err.message}`,
	serializers: {
		// originalUrl: routers rewrite req.url to the part after where they're mounted
		req: (req) => ({
			id: req.id,
			method: req.method,
			url: req.originalUrl,
		}),
		res: (res) => ({ statusCode: res.statusCode }),
	},
});
