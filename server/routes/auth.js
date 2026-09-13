const express = require('express');
const { signup, signin, verifyAccountOtp, getProfile } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/verify-otp', verifyAccountOtp);
router.get('/me', requireAuth, getProfile);

module.exports = router;
