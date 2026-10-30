const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { authenticator } = require('otplib');
const User = require('../models/User');
const { issueOtp, consumeOtp } = require('../utils/otp');

const MFA_ISSUER = 'College-Events-hub';
// Allow one 30s step of clock drift
authenticator.options = { window: 1 };

const signToken = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Short-lived token for the MFA step; not a session
const signMfaToken = (user) => jwt.sign({ id: user.id, purpose: 'mfa' }, process.env.JWT_SECRET, { expiresIn: '5m' });

const sessionPayload = (user) => ({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: signToken(user)
});

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        if (await User.findOne({ email: normalizedEmail })) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        // Role is never taken from the request body; the model hashes the password
        await User.create({ name, email: normalizedEmail, password, role: 'student', isVerified: false });
        await issueOtp(normalizedEmail, 'account_verification');

        res.status(201).json({ message: 'Verification code sent to your email', email: normalizedEmail });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.signin = async (req, res) => {
    try {
        const email = (req.body.email || '').toLowerCase().trim();
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        if (!user.isVerified && user.role !== 'admin') {
            await issueOtp(user.email, 'account_verification');
            return res.status(403).json({ message: 'Please verify your account', needsVerification: true, email: user.email });
        }

        if (user.mfaEnabled) {
            return res.json({ mfaRequired: true, mfaToken: signMfaToken(user), email: user.email });
        }

        res.json(sessionPayload(user));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.verifyAccountOtp = async (req, res) => {
    try {
        const email = (req.body.email || '').toLowerCase().trim();
        if (!(await consumeOtp(email, req.body.otp, 'account_verification'))) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
        if (!user) return res.status(404).json({ message: 'Account not found' });

        res.json(sessionPayload(user));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getProfile = (req, res) => {
    const { _id, name, email, role, mfaEnabled, createdAt } = req.user;
    res.json({ _id, name, email, role, mfaEnabled, createdAt });
};

// Sign-in step 2: authenticator code
exports.verifyMfa = async (req, res) => {
    try {
        const { mfaToken, code } = req.body;
        let decoded;
        try {
            decoded = jwt.verify(mfaToken || '', process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Sign-in expired, please enter your password again' });
        }
        if (decoded.purpose !== 'mfa') return res.status(401).json({ message: 'Invalid sign-in token' });

        const user = await User.findById(decoded.id).select('+mfaSecret');
        if (!user || !user.mfaEnabled || !authenticator.verify({ token: String(code || ''), secret: user.mfaSecret })) {
            return res.status(400).json({ message: 'Invalid authenticator code' });
        }

        res.json(sessionPayload(user));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// MFA enrolment: new secret + QR code (pending until confirmed)
exports.setupMfa = async (req, res) => {
    try {
        const secret = authenticator.generateSecret();
        await User.updateOne({ _id: req.user._id }, { mfaPendingSecret: secret });

        const otpauthUrl = authenticator.keyuri(req.user.email, MFA_ISSUER, secret);
        res.json({ otpauthUrl, secret, qrCode: await QRCode.toDataURL(otpauthUrl) });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// First valid code turns MFA on
exports.enableMfa = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+mfaPendingSecret');
        if (!user.mfaPendingSecret) return res.status(400).json({ message: 'Start MFA setup first' });
        if (!authenticator.verify({ token: String(req.body.code || ''), secret: user.mfaPendingSecret })) {
            return res.status(400).json({ message: 'Invalid authenticator code' });
        }

        user.mfaSecret = user.mfaPendingSecret;
        user.mfaPendingSecret = undefined;
        user.mfaEnabled = true;
        await user.save();
        res.json({ message: 'Two-factor authentication enabled', mfaEnabled: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
