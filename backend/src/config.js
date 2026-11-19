import { z } from 'zod';

// .env is optional: Docker and CI pass real environment variables instead,
// and those always win over values in the file
try {
	process.loadEnvFile();
} catch {
	// no .env file
}

const schema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	PORT: z.coerce.number().int().positive().default(4000),
	MONGODB_URI: z.string({ error: 'is required' }).min(1, 'is required'),
	JWT_SECRET: z
		.string({ error: 'is required' })
		.min(16, 'must be at least 16 characters'),
	JWT_EXPIRES_IN: z.string().default('1d'),
	// comma separated list of web app origins allowed to call the API
	CORS_ORIGIN: z.string().default('http://localhost:5173'),
	// number of proxies in front of the API (1 behind the nginx in Docker)
	TRUST_PROXY: z.coerce.number().int().min(0).default(0),
	// folder of the built web app (frontend/dist). When set, the API serves it
	// too, so the whole app is one service; Docker uses nginx instead
	WEB_APP_DIR: z.string().min(1).optional(),
	// fill an empty database with demo restaurants and accounts on startup
	SEED_DEMO_DATA: z.stringbool().default(false),
	// let people log in to those demo accounts with the shared password; a public
	// site turns this off, so nobody can change the restaurants everyone sees
	DEMO_ACCOUNTS_LOGIN: z.stringbool().default(true),
	// let visitors create their own accounts
	SIGNUPS_ENABLED: z.stringbool().default(true),
	// "Try the demo": each visitor gets a private copy of the demo data
	DEMO_ENABLED: z.stringbool().default(true),
	DEMO_TTL_HOURS: z.coerce.number().positive().default(24),
	DEMO_MAX_ACTIVE: z.coerce.number().int().positive().default(200),
	// new demos per IP address per hour
	DEMO_RATE_LIMIT: z.coerce.number().int().positive().default(10),
});

const result = schema.safeParse(process.env);

if (!result.success) {
	console.error('Invalid environment variables:');
	for (const issue of result.error.issues) {
		console.error(`  ${issue.path.join('.')} ${issue.message}`);
	}
	console.error('Copy .env.example to .env to get started.');
	process.exit(1);
}

export const config = result.data;
