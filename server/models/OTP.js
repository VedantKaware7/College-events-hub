const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ['account_verification', 'event_registration'], required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } // auto-deleted after 5 minutes
});

module.exports = mongoose.model('OTP', otpSchema);
