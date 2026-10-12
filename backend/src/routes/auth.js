import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import {
	login,
	loginSchema,
	me,
	register,
	registerSchema,
} from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

// slows down password guessing: 20 tries per 15 minutes per IP
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: config.NODE_ENV === 'test' ? 1000 : 20,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: {
		message: 'Too many attempts, please try again in a few minutes',
	},
});

const router = Router();

router.post('/register', limiter, validateBody(registerSchema), register);
router.post('/login', limiter, validateBody(loginSchema), login);
router.get('/me', requireAuth, me);

export default router;
