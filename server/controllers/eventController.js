const Event = require('../models/Event');
const Registration = require('../models/Registration');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.listEvents = async (req, res) => {
    try {
        const { category, club, search, when } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (club) filter.club = club;
        if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
        if (when === 'upcoming') filter.date = { $gte: new Date() };
        if (when === 'past') filter.date = { $lt: new Date() };

        const events = await Event.find(filter)
            .sort({ date: when === 'past' ? -1 : 1 })
            .populate('organizer', 'name email');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getEventFilters = async (req, res) => {
    try {
        const clubs = await Event.distinct('club');
        res.json({ categories: Event.CATEGORIES, clubs: clubs.sort() });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(400).json({ message: 'Invalid event id' });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, venue, category, club, capacity, entryFee, bannerUrl } = req.body;
        const event = await Event.create({
            title,
            description,
            date,
            venue,
            category,
            club,
            capacity,
            seatsLeft: capacity,
            entryFee: entryFee || 0,
            bannerUrl: bannerUrl || '',
            organizer: req.user.id
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const editable = ['title', 'description', 'date', 'venue', 'category', 'club', 'entryFee', 'bannerUrl'];
        editable.forEach((field) => {
            if (req.body[field] !== undefined) event[field] = req.body[field];
        });

        // Keep seatsLeft consistent when capacity changes
        if (req.body.capacity !== undefined) {
            const taken = event.capacity - event.seatsLeft;
            const newCapacity = Number(req.body.capacity);
            if (newCapacity < taken) {
                return res.status(400).json({ message: `Capacity cannot be lower than ${taken} approved registrations` });
            }
            event.capacity = newCapacity;
            event.seatsLeft = newCapacity - taken;
        }

        await event.save();
        res.json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        await Registration.deleteMany({ event: event._id });
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
