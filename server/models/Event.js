const mongoose = require('mongoose');

const EVENT_CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon'];

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    venue: { type: String, required: true },
    category: { type: String, enum: EVENT_CATEGORIES, required: true },
    club: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    seatsLeft: { type: Number, required: true, min: 0 },
    bannerUrl: { type: String, default: '' },
    entryFee: { type: Number, required: true, default: 0, min: 0 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

eventSchema.statics.CATEGORIES = EVENT_CATEGORIES;

module.exports = mongoose.model('Event', eventSchema);
