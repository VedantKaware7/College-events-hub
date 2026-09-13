const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['pending', 'approved', 'cancelled'], default: 'pending' },
    feeStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
    entryFee: { type: Number, required: true, default: 0 },
    registeredAt: { type: Date, default: Date.now }
}, { timestamps: true });

registrationSchema.index({ student: 1, event: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
