const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, signin, verifyAccountOtp, getProfile, verifyMfa, setupMfa, enableMfa } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Limit password and code guessing
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.LOGIN_RATE_LIMIT || 20),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again in 15 minutes' }
});

router.post('/signup', signup);
router.post('/signin', loginLimiter, signin);
router.post('/verify-otp', loginLimiter, verifyAccountOtp);
router.get('/me', requireAuth, getProfile);

// TOTP multi-factor authentication
router.post('/mfa/verify', loginLimiter, verifyMfa);
router.post('/mfa/setup', requireAuth, setupMfa);
router.post('/mfa/enable', requireAuth, enableMfa);

module.exports = router;
