require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_events_hub';

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
}

// MONGO_DB_NAME overrides the database in the URI
mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB_NAME })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err.message));

const server = app.listen(PORT, '0.0.0.0', () => console.log(`College-Events-hub API listening on port ${PORT}`));

// Finish in-flight requests before exiting
const shutdown = (signal) => {
    console.log(`${signal} received, closing server`);
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
    setTimeout(() => process.exit(0), 10000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
