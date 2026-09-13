const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { issueOtp, consumeOtp } = require('../utils/otp');
const { sendRegistrationApprovedMail } = require('../utils/email');

exports.sendRegistrationOtp = async (req, res) => {
    try {
        await issueOtp(req.user.email, 'event_registration');
        res.json({ message: 'Verification code sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Could not send verification code', error: error.message });
    }
};

exports.registerForEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.date < new Date()) return res.status(400).json({ message: 'This event has already happened' });
        if (event.seatsLeft <= 0) return res.status(400).json({ message: 'Event is full' });

        const existing = await Registration.findOne({ student: req.user.id, event: eventId, status: { $ne: 'cancelled' } });
        if (existing) return res.status(400).json({ message: 'You are already registered for this event' });

        if (!(await consumeOtp(req.user.email, otp, 'event_registration'))) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        const registration = await Registration.create({
            student: req.user.id,
            event: eventId,
            entryFee: event.entryFee,
            feeStatus: event.entryFee === 0 ? 'paid' : 'unpaid'
        });

        res.status(201).json({ message: 'Registration submitted for approval', registration });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ student: req.user.id })
            .populate('event')
            .sort({ createdAt: -1 });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllRegistrations = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.eventId) filter.event = req.query.eventId;

        const registrations = await Registration.find(filter)
            .populate('event', 'title date club category entryFee')
            .populate('student', 'name email')
            .sort({ createdAt: -1 });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.approveRegistration = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id).populate('student').populate('event');
        if (!registration) return res.status(404).json({ message: 'Registration not found' });
        if (registration.status === 'approved') return res.status(400).json({ message: 'Already approved' });
        if (!registration.event) return res.status(400).json({ message: 'Event no longer exists' });

        // Atomically take a seat so two approvals can't oversell the event
        const event = await Event.findOneAndUpdate(
            { _id: registration.event._id, seatsLeft: { $gt: 0 } },
            { $inc: { seatsLeft: -1 } },
            { new: true }
        );
        if (!event) return res.status(400).json({ message: 'No seats left for this event' });

        registration.status = 'approved';
        if (req.body.feeStatus) registration.feeStatus = req.body.feeStatus;
        await registration.save();

        await sendRegistrationApprovedMail(registration.student.email, registration.student.name, event.title);

        res.json({ message: 'Registration approved', registration });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.cancelRegistration = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id);
        if (!registration) return res.status(404).json({ message: 'Registration not found' });
        if (registration.student.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not allowed' });
        }
        if (registration.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        const wasApproved = registration.status === 'approved';
        registration.status = 'cancelled';
        await registration.save();

        // A seat is only held by approved registrations
        if (wasApproved) {
            await Event.updateOne({ _id: registration.event }, { $inc: { seatsLeft: 1 } });
        }

        res.json({ message: 'Registration cancelled' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const [totalEvents, upcomingEvents, byStatus, revenue, byCategory] = await Promise.all([
            Event.countDocuments(),
            Event.countDocuments({ date: { $gte: new Date() } }),
            Registration.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Registration.aggregate([
                { $match: { status: 'approved', feeStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$entryFee' } } }
            ]),
            Event.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
        ]);

        const statusCounts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
        res.json({
            totalEvents,
            upcomingEvents,
            pending: statusCounts.pending || 0,
            approved: statusCounts.approved || 0,
            cancelled: statusCounts.cancelled || 0,
            feesCollected: revenue[0]?.total || 0,
            eventsByCategory: byCategory.map((c) => ({ category: c._id, count: c.count }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
