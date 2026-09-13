const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { issueOtp, consumeOtp } = require('../utils/otp');

const signToken = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

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

        const hashed = await bcrypt.hash(password, 10);
        // Role is never taken from the request body
        await User.create({ name, email: normalizedEmail, password: hashed, role: 'student', isVerified: false });
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
    const { _id, name, email, role, createdAt } = req.user;
    res.json({ _id, name, email, role, createdAt });
};
