const Event = require('../models/Event');
const Registration = require('../models/Registration');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Short cache for the event list (peak-load endpoint)
const LIST_CACHE_TTL_MS = Number(process.env.EVENTS_CACHE_TTL_MS ?? 5000);
const LIST_CACHE_MAX_KEYS = 200;
const listCache = new Map();
const clearListCache = () => listCache.clear();

// Faculty may only change their own events
const canManage = (user, event) => user.role === 'admin' || String(event.organizer) === String(user._id);

exports.listEvents = async (req, res) => {
    try {
        const { category, club, search, when } = req.query;
        const cacheKey = JSON.stringify([category, club, search, when]);
        let entry = listCache.get(cacheKey);

        if (!entry || entry.expires <= Date.now()) {
            const filter = {};
            if (category) filter.category = category;
            if (club) filter.club = club;
            if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
            if (when === 'upcoming') filter.date = { $gte: new Date() };
            if (when === 'past') filter.date = { $lt: new Date() };

            // Concurrent misses share one query
            entry = {
                expires: Date.now() + LIST_CACHE_TTL_MS,
                body: Event.find(filter)
                    .sort({ date: when === 'past' ? -1 : 1 })
                    .populate('organizer', 'name email')
                    .then((events) => JSON.stringify(events))
            };
            if (listCache.size >= LIST_CACHE_MAX_KEYS) clearListCache();
            listCache.set(cacheKey, entry);
            const pending = entry;
            pending.body.catch(() => listCache.get(cacheKey) === pending && listCache.delete(cacheKey));
        }

        res.type('json').send(await entry.body);
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
        clearListCache();
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (!canManage(req.user, event)) {
            return res.status(403).json({ message: 'You can only edit events you organise' });
        }

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
        clearListCache();
        res.json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (!canManage(req.user, event)) {
            return res.status(403).json({ message: 'You can only delete events you organise' });
        }

        await event.deleteOne();
        clearListCache();
        await Registration.deleteMany({ event: event._id });
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
