const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const os = require('os');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');

const app = express();
const INSTANCE = process.env.INSTANCE_NAME || os.hostname();

// Behind nginx: use X-Forwarded-For as the client IP
app.set('trust proxy', 1);

// Shows which replica served the request
app.use((req, res, next) => {
    res.set('X-Instance', INSTANCE);
    next();
});

const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
// inflate: false rejects compressed bodies (body-parser DoS)
app.use(express.json({ limit: '100kb', inflate: false }));

// Used by Docker HEALTHCHECK and the deploy pipeline
app.get('/api/health', (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(dbConnected ? 200 : 503).json({
        status: dbConnected ? 'ok' : 'degraded',
        db: dbConnected ? 'connected' : 'disconnected',
        instance: INSTANCE,
        uptime: Math.round(process.uptime()),
        version: (process.env.RENDER_GIT_COMMIT || '').slice(0, 7) || process.env.APP_VERSION || 'dev'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

module.exports = app;
