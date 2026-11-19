import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import {
	getPublicConfig,
	startDemo,
	startDemoSchema,
	switchDemoRole,
} from '../controllers/demo.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

// a demo writes about 35 documents, so each IP gets a few per hour
const limiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: config.NODE_ENV === 'test' ? 1000 : config.DEMO_RATE_LIMIT,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: {
		message:
			"You've started several demos recently. Please try again later.",
	},
});

const router = Router();

router.get('/config', getPublicConfig);
router.post('/demo', limiter, validateBody(startDemoSchema), startDemo);
router.post('/demo/switch', requireAuth, switchDemoRole);

export default router;
