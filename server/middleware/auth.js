const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        // MFA step tokens are not sessions
        if (decoded.purpose) {
            return res.status(401).json({ message: 'Sign-in not completed' });
        }
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'Account no longer exists' });
        }
        next();
    } catch (error) {
        res.status(401).json({ message: 'Session expired, please sign in again' });
    }
};

const requireRole = (...roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    res.status(403).json({ message: `Requires role: ${roles.join(' or ')}` });
};

const requireAdmin = requireRole('admin');

module.exports = { requireAuth, requireRole, requireAdmin };
